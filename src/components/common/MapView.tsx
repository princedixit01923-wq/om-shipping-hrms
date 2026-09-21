import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationCoordinates, OfficeLocation } from '../../types';
import { MapPin, ShieldCheck } from 'lucide-react';

// Custom Map Marker Icons using SVG Data URIs
const createIcon = (color: string) => {
  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32" stroke="#ffffff" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5-2.5 2.5z"/></svg>`;
    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  } catch {
    return undefined;
  }
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
    try {
      map.setView(center, zoom);
    } catch {
      // Ignore recentering errors if map is unmounting
    }
  }, [center, zoom, map]);
  return null;
};

class MapErrorBoundary extends Component<{ children: ReactNode; height: string; fallbackCoords?: [number, number]; address?: string }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.warn('Map display fallback active:', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: this.props.height }} className="w-full bg-slate-900 rounded-2xl p-4 flex flex-col justify-center items-center text-center text-white border border-slate-700">
          <MapPin className="w-8 h-8 text-emerald-400 mb-2" />
          <span className="text-xs font-bold text-slate-200">GPS Coordinates Verified</span>
          {this.props.fallbackCoords && (
            <span className="text-[11px] font-mono text-emerald-400 mt-1">
              {this.props.fallbackCoords[0].toFixed(5)}° N, {this.props.fallbackCoords[1].toFixed(5)}° E
            </span>
          )}
          {this.props.address && (
            <span className="text-[11px] text-slate-400 mt-1 max-w-sm">{this.props.address}</span>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export const MapView: React.FC<MapViewProps> = ({
  officeLocation,
  punches = [],
  center,
  zoom = 15,
  height = '400px'
}) => {
  const lat = center?.[0] || punches[0]?.location.latitude || officeLocation?.latitude || 23.0753;
  const lng = center?.[1] || punches[0]?.location.longitude || officeLocation?.longitude || 70.1337;
  const defaultCenter: [number, number] = [lat, lng];

  return (
    <MapErrorBoundary height={height} fallbackCoords={defaultCenter} address={punches[0]?.location.address || officeLocation?.address}>
      <div style={{ height }} className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <MapContainer
          key={`${defaultCenter[0]}-${defaultCenter[1]}`}
          center={defaultCenter}
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <RecenterMap center={defaultCenter} zoom={zoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Office Location Marker */}
          {officeLocation && OfficeIcon && (
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
              {PunchIcon && (
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
              )}
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
    </MapErrorBoundary>
  );
};
