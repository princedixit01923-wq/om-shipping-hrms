export interface Point {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two lat/lng points in meters using Haversine Formula
 */
export function calculateDistanceMeters(point1: Point, point2: Point): number {
  const R = 6371e3; // Earth radius in meters
  const rad1 = (point1.latitude * Math.PI) / 180;
  const rad2 = (point2.latitude * Math.PI) / 180;
  const deltaRad = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLng = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaRad / 2) * Math.sin(deltaRad / 2) +
    Math.cos(rad1) * Math.cos(rad2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Reverse geocoding utility using OpenStreetMap Nominatim API to get actual street/city address
 */
export async function getReverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { 'User-Agent': 'OMShippingPrinceHRMS/2.0' }
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch (err) {
    console.warn('Reverse geocoding fetch fallback:', err);
  }

  // Precision coordinate representation if network request is blocked
  return `GPS Pos: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
}
