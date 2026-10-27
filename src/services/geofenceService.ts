import { reverseGeocodeCoords } from './locationService';

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
 * Reverse geocoding utility with dual-provider fallback to get actual street/city/port address
 */
export async function getReverseGeocode(lat: number, lng: number): Promise<string> {
  return reverseGeocodeCoords(lat, lng);
}
