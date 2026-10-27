import { LocationCoordinates } from '../types';

/**
 * Result of reverse geocoding
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  // 1. Try OpenStreetMap Nominatim with strict timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { 'User-Agent': 'OMShippingHRMS/2.0' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch {
    // Continue to next provider
  }

  // 2. Try BigDataCloud Client Reverse Geocode (high speed, accurate Indian ports and cities)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const parts = [
        data.locality,
        data.city || data.localityInfo?.administrative?.[2]?.name,
        data.principalSubdivision,
        data.postcode,
        data.countryName
      ].filter(Boolean);

      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
  } catch {
    // Fallback to coordinates
  }

  return `GPS Pos: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
}

/**
 * Fallback to IP-based Geolocation when hardware GPS is unavailable or blocked
 */
async function fetchIpGeolocation(): Promise<{ latitude: number; longitude: number; accuracy: number; address: string } | null> {
  // Provider 1: ipapi.co
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const cityDesc = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 5000,
          address: cityDesc ? `${cityDesc} (Network Estimated Location)` : 'Network Estimated Location'
        };
      }
    }
  } catch {
    // try next
  }

  // Provider 2: freeipapi.com
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const cityDesc = [data.cityName, data.regionName, data.countryName].filter(Boolean).join(', ');
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 5000,
          address: cityDesc ? `${cityDesc} (Network Estimated Location)` : 'Network Estimated Location'
        };
      }
    }
  } catch {
    // Failed all IP providers
  }

  return null;
}

/**
 * Query navigator.geolocation with customizable options wrapped in a Promise
 */
function queryBrowserPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Acquire genuine real-time live location coordinates using a progressive multi-tier strategy:
 * Tier 1: Hardware High-Accuracy GPS (Fine Satellite Lock)
 * Tier 2: Standard/Coarse Accuracy (Cell-Tower / Wi-Fi Triangulation)
 * Tier 3: Network IP Geolocation Fallback
 * 
 * NEVER returns fake Gandhidham coordinates!
 */
export async function getAccurateLiveLocation(): Promise<LocationCoordinates> {
  let pos: GeolocationPosition | null = null;
  let isHardwareGps = false;

  // Tier 1: High-Accuracy Hardware GPS (15s timeout, allows recent 10s fix)
  try {
    pos = await queryBrowserPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000
    });
    isHardwareGps = true;
  } catch (err: any) {
    console.warn('Tier 1 High-Accuracy GPS timed out or failed. Falling back to Tier 2 Standard/Network GPS...', err);
  }

  // Tier 2: Standard/Cell-Tower/Wi-Fi Triangulation (fast, works indoors and at ports)
  if (!pos) {
    try {
      pos = await queryBrowserPosition({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000
      });
      isHardwareGps = true;
    } catch (err: any) {
      console.warn('Tier 2 Standard Geolocation failed. Trying Tier 3 Network IP Geolocation...', err);
    }
  }

  // If browser geolocation succeeded
  if (pos && pos.coords) {
    const { latitude, longitude, accuracy } = pos.coords;
    const address = await reverseGeocodeCoords(latitude, longitude);
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 45) : 'Mobile Browser';

    return {
      latitude,
      longitude,
      accuracy: Math.round(accuracy || 10),
      timestamp: pos.timestamp || Date.now(),
      address,
      deviceInfo: `${userAgent} (${isHardwareGps ? 'Live GPS' : 'Network Position'})`
    };
  }

  // Tier 3: Network IP Geolocation
  const ipResult = await fetchIpGeolocation();
  if (ipResult) {
    return {
      latitude: ipResult.latitude,
      longitude: ipResult.longitude,
      accuracy: ipResult.accuracy,
      timestamp: Date.now(),
      address: ipResult.address,
      deviceInfo: `${navigator.userAgent.substring(0, 45)} (Network IP Position)`
    };
  }

  // If ALL tiers failed, throw an honest, user-actionable error instead of faking coordinates
  throw new Error(
    'Unable to detect your live location. Please turn ON Location/GPS in your phone/browser settings and tap "Update GPS Location".'
  );
}

/**
 * Start watching live position continuously to keep coordinates warm and fresh
 */
export function watchAccuratePosition(
  onUpdate: (coords: LocationCoordinates) => void,
  onError: (errorMsg: string) => void
): () => void {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    onError('Geolocation is not supported by your browser.');
    return () => {};
  }

  let isCancelled = false;

  const watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      if (isCancelled || !pos || !pos.coords) return;
      try {
        const { latitude, longitude, accuracy } = pos.coords;
        const address = await reverseGeocodeCoords(latitude, longitude);
        if (!isCancelled) {
          onUpdate({
            latitude,
            longitude,
            accuracy: Math.round(accuracy || 15),
            timestamp: pos.timestamp || Date.now(),
            address,
            deviceInfo: `${navigator.userAgent.substring(0, 45)} (Live GPS Watch)`
          });
        }
      } catch {
        // preserve existing
      }
    },
    (err) => {
      if (isCancelled) return;
      if (err.code === err.PERMISSION_DENIED) {
        onError('Location permission denied. Please allow location access in your browser to record attendance.');
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        onError('GPS position currently unavailable. Please ensure device GPS is turned ON.');
      } else if (err.code === err.TIMEOUT) {
        onError('GPS signal acquisition timed out. Tap "Update GPS Location" to retry.');
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000
    }
  );

  return () => {
    isCancelled = true;
    navigator.geolocation.clearWatch(watchId);
  };
}
