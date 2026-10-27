import React, { useState, useEffect } from 'react';
import { MapPin, Search, Calendar, Filter, Navigation, ShieldCheck, RotateCcw } from 'lucide-react';
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
  const [selectedDate, setSelectedDate] = useState(''); // Default empty = All dates
  const [selectedMapCenter, setSelectedMapCenter] = useState<[number, number]>([
    officeLocation.latitude,
    officeLocation.longitude
  ]);
  const [mapZoom, setMapZoom] = useState(13);

  const reloadData = () => {
    const records = dbService.getAttendanceRecords();
    setAttendance(records);

    // If records exist with punches, center on the most recent punch
    const firstWithPunch = records.find((r) => r.punchIn);
    if (firstWithPunch?.punchIn) {
      setSelectedMapCenter([firstWithPunch.punchIn.latitude, firstWithPunch.punchIn.longitude]);
    }
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const availableDepts = Array.from(
    new Set([
      'Technical Department',
      'Sales Department',
      'Finance Department',
      ...attendance.map((r) => r.departmentName).filter(Boolean)
    ])
  );

  const filteredRecords = attendance.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || r.departmentName === selectedDept;
    const matchesDate = !selectedDate || r.date === selectedDate;
    return matchesSearch && matchesDept && matchesDate;
  });

  // Map markers payload for all punches (Punch In + Punch Out)
  const mapPunches: {
    employeeName: string;
    employeeId: string;
    type: 'Punch In' | 'Punch Out';
    location: any;
    timeStr: string;
  }[] = [];

  filteredRecords.forEach((r) => {
    if (r.punchIn) {
      mapPunches.push({
        employeeName: r.employeeName,
        employeeId: r.employeeId,
        type: 'Punch In',
        location: r.punchIn,
        timeStr: new Date(r.punchIn.timestamp).toLocaleTimeString()
      });
    }
    if (r.punchOut) {
      mapPunches.push({
        employeeName: r.employeeName,
        employeeId: r.employeeId,
        type: 'Punch Out',
        location: r.punchOut,
        timeStr: new Date(r.punchOut.timestamp).toLocaleTimeString()
      });
    }
  });

  const handleSelectRecord = (r: AttendanceRecord) => {
    if (r.punchIn) {
      setSelectedMapCenter([r.punchIn.latitude, r.punchIn.longitude]);
      setMapZoom(16);
    } else if (r.punchOut) {
      setSelectedMapCenter([r.punchOut.latitude, r.punchOut.longitude]);
      setMapZoom(16);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 space-y-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0055a5]" /> Real-Time Geographic Punch Map &amp; Port Monitor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect live coordinates, port and vessel punch locations, addresses &amp; accuracy across Gujarat and nationwide ports
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5] cursor-pointer"
            >
              <option value="All">All Departments</option>
              {availableDepts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Filter by date (leave empty for all dates)"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Show all dates"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
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
              {mapPunches.length} Punch Locations Plotted
            </span>
          </div>

          <MapView
            officeLocation={officeLocation}
            height="480px"
            center={selectedMapCenter}
            zoom={mapZoom}
            punches={mapPunches}
          />
        </div>

        {/* Right Col: Filtered Employee Location Records */}
        <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex flex-col h-[540px]">
          <h3 className="text-xs font-extrabold text-slate-900 pb-3 border-b border-slate-100 uppercase tracking-wider flex items-center justify-between">
            <span>Employee Location Details</span>
            <span className="text-[11px] font-bold text-slate-500">({filteredRecords.length})</span>
          </h3>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-2">
            {filteredRecords.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No attendance logs matching filter criteria.</p>
            ) : (
              filteredRecords.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectRecord(r)}
                  className="p-3 hover:bg-blue-50/60 rounded-xl transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">{r.employeeName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      {r.employeeId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold">{r.departmentName}</span>
                    <span className="text-slate-400 text-[10px] font-bold">{r.date}</span>
                  </div>

                  {r.punchIn ? (
                    <div className="text-[11px] space-y-1 pt-1 text-slate-700 font-medium bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-emerald-800">Punch In Time:</span>
                        <span className="font-bold text-emerald-700">
                          {new Date(r.punchIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Coordinates:</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {r.punchIn.latitude.toFixed(4)}° N, {r.punchIn.longitude.toFixed(4)}° E
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Accuracy:</span>
                        <span className="text-emerald-700 font-bold">±{r.punchIn.accuracy || 15}m</span>
                      </div>
                      <p className="text-[10px] text-slate-700 font-semibold line-clamp-2 pt-0.5 border-t border-slate-200/60 mt-1">
                        📍 {r.punchIn.address || 'Real-time GPS Location'}
                      </p>
                      {r.punchOut && (
                        <div className="pt-1 border-t border-slate-200/60 text-[10px] text-blue-700 font-medium">
                          <span>Punch Out: {new Date(r.punchOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {r.punchOut.address && (
                            <span className="block text-slate-600 line-clamp-1 mt-0.5">📍 {r.punchOut.address}</span>
                          )}
                        </div>
                      )}
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
