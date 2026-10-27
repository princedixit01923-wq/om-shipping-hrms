import { LocationCoordinates } from '../types';

/**
 * Reverse geocodes exact coordinates into actual physical street, port, or city address.
 * Uses real-time online geocoders without any hardcoded fallback address.
 */
export async function reverseGeocodeCoords(lat: number, lng: number, accuracy: number = 10): Promise<string> {
  // Provider 1: OpenStreetMap Nominatim
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
    // try next live provider
  }

  // Provider 2: BigDataCloud Reverse Geocoding API
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
    // fallback to coordinates
  }

  // No hardcoded address - output exact live GPS coordinate format
  return `GPS Position: ${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E (±${Math.round(accuracy)}m)`;
}

/**
 * Promise-wrapped navigator.geolocation query
 */
function queryBrowserPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser or device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Acquire genuine real-time live location coordinates from device GPS sensor.
 * STRICT POLICY:
 * - NO hardcoded addresses or coordinates
 * - NO simulated or IP-guessed addresses
 * - Requires genuine device location lock
 */
export async function getAccurateLiveLocation(): Promise<LocationCoordinates> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported on this device or browser.');
  }

  let pos: GeolocationPosition | null = null;
  let isFineGps = false;

  // 1. Try High-Accuracy Hardware GPS sensor first (15s timeout, allows recent 5s fix)
  try {
    pos = await queryBrowserPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000
    });
    isFineGps = true;
  } catch (err: any) {
    console.warn('High-accuracy GPS satellite fix timeout. Trying standard device location...', err);
  }

  // 2. If fine satellite lock timed out, try standard device location (Cell-Tower / Wi-Fi)
  if (!pos) {
    try {
      pos = await queryBrowserPosition({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 15000
      });
      isFineGps = false;
    } catch (err: any) {
      console.warn('Standard location query failed:', err);
    }
  }

  // If a genuine device position was acquired:
  if (pos && pos.coords) {
    const { latitude, longitude, accuracy } = pos.coords;
    const address = await reverseGeocodeCoords(latitude, longitude, accuracy);
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 45) : 'Mobile Device';

    return {
      latitude,
      longitude,
      accuracy: Math.round(accuracy || 10),
      timestamp: pos.timestamp || Date.now(),
      address,
      deviceInfo: `${userAgent} (${isFineGps ? 'Satellite GPS' : 'Device Network Position'})`
    };
  }

  // If no position could be acquired from the device sensor, DO NOT fake or guess any address!
  throw new Error(
    'Live GPS location could not be determined. Please ensure device Location/GPS is turned ON and location permission is granted in your browser.'
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
        const address = await reverseGeocodeCoords(latitude, longitude, accuracy);
        if (!isCancelled) {
          onUpdate({
            latitude,
            longitude,
            accuracy: Math.round(accuracy || 10),
            timestamp: pos.timestamp || Date.now(),
            address,
            deviceInfo: `${navigator.userAgent.substring(0, 45)} (Live GPS Sensor)`
          });
        }
      } catch {
        // preserve existing
      }
    },
    (err) => {
      if (isCancelled) return;
      if (err.code === err.PERMISSION_DENIED) {
        onError('Location permission denied. Please allow location access in your browser settings.');
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        onError('GPS position currently unavailable. Please turn ON device GPS / Location.');
      } else if (err.code === err.TIMEOUT) {
        onError('GPS acquisition timed out. Tap "Refresh GPS Location" to retry.');
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
