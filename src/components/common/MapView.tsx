import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocationCoordinates, OfficeLocation } from '../../types';

// Custom Map Marker Icons using SVG Data URIs
const createIcon = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32" stroke="#ffffff" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5-2.5 2.5z"/></svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const OfficeIcon = createIcon('#082d46');
const PunchIcon = createIcon('#004b93');

interface MapViewProps {
  officeLocation?: OfficeLocation;
  punches?: {
    employeeName: string;
    employeeId: string;
    type: 'Punch In' | 'Punch Out';
    location: LocationCoordinates;
    timeStr: string;
  }[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

const RecenterMap: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  officeLocation,
  punches = [],
  center,
  zoom = 15,
  height = '400px'
}) => {
  const defaultCenter: [number, number] = center || [
    punches[0]?.location.latitude || officeLocation?.latitude || 18.9438,
    punches[0]?.location.longitude || officeLocation?.longitude || 72.8360
  ];

  return (
    <div style={{ height }} className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer center={defaultCenter} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <RecenterMap center={defaultCenter} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Office Location Marker */}
        {officeLocation && (
          <Marker position={[officeLocation.latitude, officeLocation.longitude]} icon={OfficeIcon}>
            <Popup>
              <div className="p-1">
                <span className="font-extrabold text-slate-900 block">{officeLocation.name}</span>
                <span className="text-xs text-slate-600 block">{officeLocation.address}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Employee Punch Location Markers */}
        {punches.map((p, idx) => (
          <React.Fragment key={idx}>
            <Marker position={[p.location.latitude, p.location.longitude]} icon={PunchIcon}>
              <Popup>
                <div className="p-1 max-w-xs">
                  <span className="font-extrabold text-slate-900 block">{p.employeeName} ({p.employeeId})</span>
                  <span className="text-xs font-bold text-[#004b93] block">{p.type} at {p.timeStr}</span>
                  <span className="text-[11px] font-mono text-slate-600 block mt-1">
                    {p.location.latitude.toFixed(5)}° N, {p.location.longitude.toFixed(5)}° E
                  </span>
                  <span className="text-xs text-slate-600 block mt-1">{p.location.address || 'GPS Location'}</span>
                  <div className="mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                    GPS Accuracy: {p.location.accuracy}m
                  </div>
                </div>
              </Popup>
            </Marker>
            {p.location.accuracy > 0 && (
              <Circle
                center={[p.location.latitude, p.location.longitude]}
                radius={p.location.accuracy}
                pathOptions={{
                  color: '#004b93',
                  fillColor: '#0055a5',
                  fillOpacity: 0.12,
                  weight: 1
                }}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};
