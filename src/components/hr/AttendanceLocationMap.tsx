import React, { useState, useEffect } from 'react';
import { MapPin, Search, Calendar, Filter, Navigation, ShieldCheck } from 'lucide-react';
import { AttendanceRecord, OfficeLocation } from '../../types';
import { dbService } from '../../services/dbService';
import { MapView } from '../common/MapView';

interface AttendanceLocationMapProps {
  officeLocation: OfficeLocation;
}

export const AttendanceLocationMap: React.FC<AttendanceLocationMapProps> = ({ officeLocation }) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDate, setSelectedDate] = useState('2026-09-19');
  const [selectedMapCenter, setSelectedMapCenter] = useState<[number, number]>([
    officeLocation.latitude,
    officeLocation.longitude
  ]);
  const [mapZoom, setMapZoom] = useState(14);

  const reloadData = () => {
    setAttendance(dbService.getAttendanceRecords());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const filteredRecords = attendance.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || r.departmentName === selectedDept;
    const matchesDate = !selectedDate || r.date === selectedDate;
    return matchesSearch && matchesDept && matchesDate;
  });

  // Map markers payload
  const mapPunches = filteredRecords
    .filter((r) => r.punchIn)
    .map((r) => ({
      employeeName: r.employeeName,
      employeeId: r.employeeId,
      type: 'Punch In' as const,
      location: r.punchIn!,
      timeStr: new Date(r.punchIn!.timestamp).toLocaleTimeString()
    }));

  const handleSelectRecord = (r: AttendanceRecord) => {
    if (r.punchIn) {
      setSelectedMapCenter([r.punchIn.latitude, r.punchIn.longitude]);
      setMapZoom(17);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 space-y-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0055a5]" /> GPS Location Attendance & Map Monitor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect real-time GPS coordinates, reverse-geocoded addresses, and geofence boundary compliance for staff punches
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee name or ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
            >
              <option value="All">All Departments</option>
              <option value="Fleet Operations">Fleet Operations</option>
              <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Maritime IT & Systems">Maritime IT & Systems</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Leaflet Map & Location Details Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Map */}
        <div className="lg:col-span-2 bg-white p-4 rounded-2xl shadow-md border border-slate-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#0f4c81]" /> Live Geographic Punch Map
            </span>
            <span className="text-xs font-bold text-[#0055a5] bg-blue-50 px-2.5 py-0.5 rounded-full">
              {mapPunches.length} Location Markers Plotted
            </span>
          </div>

          <MapView
            officeLocation={officeLocation}
            height="460px"
            center={selectedMapCenter}
            zoom={mapZoom}
            punches={mapPunches}
          />
        </div>

        {/* Right Col: Filtered Employee Location Records */}
        <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex flex-col h-[520px]">
          <h3 className="text-xs font-extrabold text-slate-900 pb-3 border-b border-slate-100 uppercase tracking-wider">
            Employee Location Details ({filteredRecords.length})
          </h3>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-2">
            {filteredRecords.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No attendance logs matching filter criteria.</p>
            ) : (
              filteredRecords.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectRecord(r)}
                  className="p-3 hover:bg-blue-50/60 rounded-xl transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">{r.employeeName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {r.employeeId}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 block font-semibold">{r.departmentName}</span>

                  {r.punchIn ? (
                    <div className="text-[11px] space-y-0.5 pt-1 text-slate-700 font-medium">
                      <div className="flex justify-between">
                        <span>Punch In Time:</span>
                        <span className="font-bold text-emerald-700">
                          {new Date(r.punchIn.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lat / Lng:</span>
                        <span className="font-mono text-[10px]">
                          {r.punchIn.latitude.toFixed(4)}, {r.punchIn.longitude.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Geofence Status:</span>
                        <span
                          className={`font-bold ${
                            r.punchIn.isWithinGeofence ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {r.punchIn.isWithinGeofence ? '✓ Inside Radius' : '⚠ Outside Radius'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate pt-0.5">{r.punchIn.address}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-rose-600 font-bold block pt-1">No GPS Punch Recorded</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
