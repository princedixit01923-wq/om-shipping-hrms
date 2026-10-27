import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, CheckCircle, ShieldCheck, RefreshCw, AlertCircle, Compass } from 'lucide-react';
import { Employee, AttendanceRecord, OfficeLocation, LocationCoordinates, CompanySettings } from '../../types';
import { getAccurateLiveLocation, watchAccuratePosition } from '../../services/locationService';
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
  settings: _settings,
  onPunchSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [geoError, setGeoError] = useState('');
  const [currentCoords, setCurrentCoords] = useState<LocationCoordinates | null>(null);
  const [showMap, setShowMap] = useState(true);

  const fetchCurrentLocation = async (isManual = false) => {
    if (isManual) setLoading(true);
    setLocating(true);
    setGeoError('');
    try {
      const coords = await getAccurateLiveLocation();
      setCurrentCoords(coords);
      setGeoError('');
    } catch (err: any) {
      console.warn('Location acquisition issue:', err);
      setGeoError(
        err.message || 'Unable to detect your live location. Please verify device GPS and browser permissions.'
      );
    } finally {
      setLocating(false);
      if (isManual) setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial live location fetch
    fetchCurrentLocation();

    // 2. Active GPS watcher to continuously keep coordinates hot & precise while on this screen
    const stopWatch = watchAccuratePosition(
      (freshCoords) => {
        setCurrentCoords(freshCoords);
        setLocating(false);
        setGeoError('');
      },
      (errorMsg) => {
        // Only set error if we don't have any valid coordinates yet
        setCurrentCoords((prev) => {
          if (!prev) {
            setGeoError(errorMsg);
          }
          return prev;
        });
        setLocating(false);
      }
    );

    return () => stopWatch();
  }, []);

  const handlePunchIn = async () => {
    setLoading(true);
    setGeoError('');

    try {
      let coords = currentCoords;
      // If coordinates are missing or older than 45 seconds, acquire a fresh live lock
      if (!coords || Date.now() - coords.timestamp > 45000) {
        coords = await getAccurateLiveLocation();
        setCurrentCoords(coords);
      }

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

      await dbService.recordPunchIn(newRecord);
      onPunchSuccess();
    } catch (err: any) {
      setGeoError(err.message || 'Unable to record punch. Real-time location verification is required.');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setLoading(true);
    setGeoError('');

    try {
      let coords = currentCoords;
      // If coordinates are missing or older than 45 seconds, acquire a fresh live lock
      if (!coords || Date.now() - coords.timestamp > 45000) {
        coords = await getAccurateLiveLocation();
        setCurrentCoords(coords);
      }

      await dbService.recordPunchOut(employee?.employeeId || 'OM0001', coords);
      onPunchSuccess();
    } catch (err: any) {
      setGeoError(err.message || 'Unable to record punch out. Real-time location verification is required.');
    } finally {
      setLoading(false);
    }
  };

  const hasPunchedIn = Boolean(todayRecord?.punchIn);
  const hasPunchedOut = Boolean(todayRecord?.punchOut);
  const isField = employee?.staffCategory === 'Field Staff' || employee?.departmentName === 'Technical Department';

  // Helper for accuracy label and color
  const getAccuracyBadge = (acc: number) => {
    if (acc <= 30) {
      return {
        label: `High-Precision GPS (±${acc}m)`,
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (acc <= 200) {
      return {
        label: `Cell / Wi-Fi Triangulation (±${acc}m)`,
        bg: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    }
    return {
      label: `Network Coarse Location (±${acc}m)`,
      bg: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  };

  const accuracyBadge = currentCoords ? getAccuracyBadge(currentCoords.accuracy) : null;

  return (
    <div className="bg-white rounded-xl p-5 shadow-2xs border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900">Live GPS Location Punch</h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
              <Compass className="w-3 h-3 text-blue-500 animate-spin" style={{ animationDuration: '8s' }} />
              Live Sensor
            </span>
            {isField && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Field Staff • Flexible Anytime Punch
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isField
              ? 'Technical & Field Staff can punch from any vessel, port, or field client site with verified real-time coordinates.'
              : 'Captures your exact real-time location (Latitude, Longitude & Address) for office/field attendance.'}
          </p>
        </div>

        <button
          onClick={() => fetchCurrentLocation(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors self-start md:self-auto cursor-pointer"
          title="Refresh GPS from device sensor"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading || locating ? 'animate-spin text-blue-600' : ''}`} />
          <span>{loading || locating ? 'Acquiring GPS...' : 'Refresh GPS Location'}</span>
        </button>
      </div>

      {/* Error alert with recovery guidance */}
      {geoError && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-900 block">Location Access Issue:</span>
              <span className="block mt-0.5">{geoError}</span>
            </div>
          </div>
          <div className="pl-6 text-[11px] text-rose-700 space-y-1">
            <p>• <strong>Android / Mobile Phone:</strong> Pull down your notification bar, ensure <strong>Location / GPS</strong> is turned ON, and reload.</p>
            <p>• <strong>Chrome / Browser:</strong> Tap the padlock icon (🔒) or tune icon near the URL bar &gt; Permissions &gt; set <strong>Location to Allow</strong>.</p>
          </div>
          <div className="pl-6 pt-1">
            <button
              onClick={() => fetchCurrentLocation(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Retry Location Lock Now
            </button>
          </div>
        </div>
      )}

      {/* Real-time Location Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Captured Latitude</span>
          <span className="text-xs font-bold text-slate-900 block mt-0.5 font-mono">
            {currentCoords ? `${currentCoords.latitude.toFixed(6)}° N` : locating ? 'Acquiring...' : 'GPS Pending'}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Captured Longitude</span>
          <span className="text-xs font-bold text-slate-900 block mt-0.5 font-mono">
            {currentCoords ? `${currentCoords.longitude.toFixed(6)}° E` : locating ? 'Acquiring...' : 'GPS Pending'}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Signal Accuracy</span>
          {accuracyBadge ? (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border mt-1 inline-block ${accuracyBadge.bg}`}>
              {accuracyBadge.label}
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-400 block mt-1">
              {locating ? 'Calibrating satellites...' : 'Awaiting sensor'}
            </span>
          )}
        </div>
      </div>

      {/* Verified Punch Address Display */}
      {currentCoords?.address ? (
        <div className="mb-4 text-xs font-medium text-slate-700 bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-blue-900 block">Verified Real-Time Punch Address:</span>
            <span className="text-slate-900 font-semibold block mt-0.5 break-words">{currentCoords.address}</span>
            {currentCoords.deviceInfo && (
              <span className="text-[10px] text-slate-500 block mt-1 font-mono">{currentCoords.deviceInfo}</span>
            )}
          </div>
        </div>
      ) : locating ? (
        <div className="mb-4 text-xs font-medium text-blue-700 bg-blue-50/40 p-3 rounded-lg border border-blue-100 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          <span>Locking on to live GPS coordinates... Please wait a moment.</span>
        </div>
      ) : null}

      {/* Punch Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 my-4">
        <button
          onClick={handlePunchIn}
          disabled={hasPunchedIn || loading || (!currentCoords && locating)}
          className={`w-full sm:w-1/2 py-3 px-5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
            hasPunchedIn
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              : !currentCoords && locating
              ? 'bg-slate-200 text-slate-500 cursor-wait'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer'
          }`}
        >
          {hasPunchedIn ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>PUNCHED IN AT {new Date(todayRecord!.punchIn!.timestamp).toLocaleTimeString()}</span>
            </>
          ) : loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>VERIFYING LOCATION &amp; PUNCHING IN...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              <span>PUNCH IN (REAL-TIME LOCATION)</span>
            </>
          )}
        </button>

        <button
          onClick={handlePunchOut}
          disabled={!hasPunchedIn || hasPunchedOut || loading || (!currentCoords && locating)}
          className={`w-full sm:w-1/2 py-3 px-5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
            !hasPunchedIn || hasPunchedOut
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              : !currentCoords && locating
              ? 'bg-slate-200 text-slate-500 cursor-wait'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs cursor-pointer'
          }`}
        >
          {hasPunchedOut ? (
            <>
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>PUNCHED OUT ({todayRecord?.workingHours || 0} HRS)</span>
            </>
          ) : loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>VERIFYING LOCATION &amp; PUNCHING OUT...</span>
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
            Verified Live Location Map
          </span>
          <button
            onClick={() => setShowMap(!showMap)}
            className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>

        {showMap && currentCoords && (
          <MapView
            height="240px"
            center={[currentCoords.latitude, currentCoords.longitude]}
            officeLocation={officeLocation}
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
