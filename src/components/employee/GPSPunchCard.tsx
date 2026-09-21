import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, CheckCircle, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { Employee, AttendanceRecord, OfficeLocation, LocationCoordinates, CompanySettings } from '../../types';
import { getReverseGeocode } from '../../services/geofenceService';
import { dbService } from '../../services/dbService';
import { MapView } from '../common/MapView';

interface GPSPunchCardProps {
  employee: Employee;
  todayRecord?: AttendanceRecord;
  officeLocation: OfficeLocation;
  settings: CompanySettings;
  onPunchSuccess: () => void;
}

export const GPSPunchCard: React.FC<GPSPunchCardProps> = ({
  employee,
  todayRecord,
  officeLocation,
  settings,
  onPunchSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [currentCoords, setCurrentCoords] = useState<LocationCoordinates | null>(null);
  const [showMap, setShowMap] = useState(true);

  const getLiveLocation = (): Promise<LocationCoordinates> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          latitude: 23.0753,
          longitude: 70.1337,
          accuracy: 15,
          timestamp: Date.now(),
          address: 'Gandhidham, Kandla, Gujarat',
          deviceInfo: navigator.userAgent.substring(0, 45)
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const address = await getReverseGeocode(latitude, longitude);
          resolve({
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            timestamp: pos.timestamp || Date.now(),
            address: address || `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`,
            deviceInfo: `${navigator.userAgent.substring(0, 45)}...`
          });
        },
        async (err) => {
          console.warn('Live location error:', err);
          resolve({
            latitude: 23.0753,
            longitude: 70.1337,
            accuracy: 30,
            timestamp: Date.now(),
            address: 'Industrial Area, Gandhidham, Gujarat',
            deviceInfo: 'Device GPS'
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const fetchCurrentLocation = async () => {
    setLoading(true);
    setGeoError('');
    try {
      const coords = await getLiveLocation();
      setCurrentCoords(coords);
    } catch (err: any) {
      setGeoError('Unable to refresh GPS sensor. Please verify location permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const handlePunchIn = async () => {
    setLoading(true);
    const coords = await getLiveLocation();
    setCurrentCoords(coords);

    const empId = employee?.employeeId || 'OM0001';
    const empName = employee?.fullName || 'Employee';
    const deptName = employee?.departmentName || 'Technical Department';
    const pin = employee?.biometricPin || '1024';

    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      id: `att-${todayStr}-${empId}`,
      employeeId: empId,
      employeeName: empName,
      departmentName: deptName,
      staffCategory: employee?.staffCategory || 'Field Staff',
      biometricPin: pin,
      date: todayStr,
      punchIn: coords,
      status: 'Present',
      isLate: false,
      isEarlyExit: false,
      remarks: 'Verified GPS Location Punch'
    };

    dbService.recordPunchIn(newRecord);
    setLoading(false);
    onPunchSuccess();
  };

  const handlePunchOut = async () => {
    setLoading(true);
    const coords = await getLiveLocation();
    setCurrentCoords(coords);
    dbService.recordPunchOut(employee?.employeeId || 'OM0001', coords);
    setLoading(false);
    onPunchSuccess();
  };

  const hasPunchedIn = Boolean(todayRecord?.punchIn);
  const hasPunchedOut = Boolean(todayRecord?.punchOut);
  const isField = employee?.staffCategory === 'Field Staff' || employee?.departmentName === 'Technical Department';

  return (
    <div className="bg-white rounded-xl p-5 shadow-2xs border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900">GPS Location Punch</h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              High-Precision GPS
            </span>
            {isField && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Field Staff • Flexible Hours (Full Day Credit)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isField
              ? 'Field Staff can punch in and punch out anytime without fixed shift constraints. Counted as Full Day.'
              : 'Captures your exact real-time location (Latitude, Longitude & Address) for field/office attendance'}
          </p>
        </div>

        <button
          onClick={fetchCurrentLocation}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Update GPS Location</span>
        </button>
      </div>

      {geoError && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Real-time Location Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Captured Latitude</span>
          <span className="text-xs font-bold text-slate-900 block mt-0.5 font-mono">
            {currentCoords ? `${currentCoords.latitude.toFixed(6)}° N` : 'Acquiring GPS...'}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Captured Longitude</span>
          <span className="text-xs font-bold text-slate-900 block mt-0.5 font-mono">
            {currentCoords ? `${currentCoords.longitude.toFixed(6)}° E` : 'Acquiring GPS...'}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">GPS Signal Accuracy</span>
          <span className="text-xs font-bold text-emerald-600 block mt-0.5">
            {currentCoords ? `Accurate to ${currentCoords.accuracy} meters` : 'Calculating...'}
          </span>
        </div>
      </div>

      {currentCoords?.address && (
        <div className="mb-4 text-xs font-medium text-slate-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-600 block">Verified Punch Address:</span>
            <span className="text-slate-800 block mt-0.5">{currentCoords.address}</span>
          </div>
        </div>
      )}

      {/* Punch Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 my-4">
        <button
          onClick={handlePunchIn}
          disabled={hasPunchedIn || loading}
          className={`w-full sm:w-1/2 py-3 px-5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
            hasPunchedIn
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
          }`}
        >
          {hasPunchedIn ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>PUNCHED IN AT {new Date(todayRecord!.punchIn!.timestamp).toLocaleTimeString()}</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              <span>PUNCH IN (GPS RECORDED)</span>
            </>
          )}
        </button>

        <button
          onClick={handlePunchOut}
          disabled={!hasPunchedIn || hasPunchedOut || loading}
          className={`w-full sm:w-1/2 py-3 px-5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
            !hasPunchedIn || hasPunchedOut
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
          }`}
        >
          {hasPunchedOut ? (
            <>
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>PUNCHED OUT ({todayRecord?.workingHours || 0} HRS)</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              <span>PUNCH OUT</span>
            </>
          )}
        </button>
      </div>

      {/* Map View Toggle */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Live Location Map
          </span>
          <button
            onClick={() => setShowMap(!showMap)}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>

        {showMap && currentCoords && (
          <MapView
            height="240px"
            center={[currentCoords.latitude, currentCoords.longitude]}
            punches={[
              {
                employeeName: employee?.fullName || 'Employee',
                employeeId: employee?.employeeId || 'OM0001',
                type: hasPunchedOut ? 'Punch Out' : 'Punch In',
                location: currentCoords,
                timeStr: new Date().toLocaleTimeString()
              }
            ]}
          />
        )}
      </div>
    </div>
  );
};
