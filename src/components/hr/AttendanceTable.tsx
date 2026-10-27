import React, { useState, useEffect } from 'react';
import { CalendarCheck, Search, Download, Calendar, Filter, RotateCcw, MapPin, X, ExternalLink } from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { dbService } from '../../services/dbService';
import { exportAttendanceToExcel } from '../../services/exportService';
import { Badge } from '../common/Badge';
import { MapView } from '../common/MapView';

export const AttendanceTable: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDate, setSelectedDate] = useState(''); // Default empty = All dates
  const [selectedRecordForMap, setSelectedRecordForMap] = useState<AttendanceRecord | null>(null);

  const reloadData = () => {
    setAttendance(dbService.getAttendanceRecords());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  // Distinct department names
  const availableDepts = Array.from(
    new Set([
      'Technical Department',
      'Sales Department',
      'Finance Department',
      ...attendance.map((r) => r.departmentName).filter(Boolean)
    ])
  );

  const filtered = attendance.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || r.departmentName === selectedDept;
    const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;
    const matchesCategory = selectedCategory === 'All' || (r.staffCategory || 'Office Staff') === selectedCategory;
    const matchesDate = !selectedDate || r.date === selectedDate;
    return matchesSearch && matchesDept && matchesStatus && matchesCategory && matchesDate;
  });

  const handleExportFilteredExcel = () => {
    exportAttendanceToExcel(filtered, `Attendance_Filtered_${selectedDate || 'All'}.xlsx`);
  };

  const handleExportAllExcel = () => {
    exportAttendanceToExcel(attendance, 'Attendance_All_Records.xlsx');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Daily GPS Attendance Register</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time verified GPS punch locations, port/field staff records, working hours &amp; cross-device attendance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportFilteredExcel}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Filtered ({filtered.length})</span>
          </button>

          <button
            onClick={handleExportAllExcel}
            className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Export All ({attendance.length})</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee or ID..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
          />
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all cursor-pointer"
          >
            <option value="All">All Departments</option>
            {availableDepts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all cursor-pointer"
          >
            <option value="All">All Staff Categories</option>
            <option value="Office Staff">Office Staff (Fixed Shift)</option>
            <option value="Field Staff">Field Staff (Flexible Full Day)</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            title="Filter by date (leave empty for all dates)"
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="p-2.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Show all dates"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                <th className="p-3">Date</th>
                <th className="p-3">Staff Member</th>
                <th className="p-3">Department</th>
                <th className="p-3">Punch In</th>
                <th className="p-3">Punch Out</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Verified Real GPS Location</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isField = r.staffCategory === 'Field Staff';
                  const inLoc = r.punchIn;
                  const outLoc = r.punchOut;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{r.date}</td>
                      <td className="p-3">
                        <span className="font-extrabold text-slate-900 block">{r.employeeName}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">{r.employeeId}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-700 block">{r.departmentName}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                            isField
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isField ? 'Field Staff' : 'Office Staff'}
                        </span>
                      </td>
                      <td className="p-3 text-emerald-700 font-bold whitespace-nowrap">
                        {r.punchIn ? new Date(r.punchIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3 text-blue-700 font-bold whitespace-nowrap">
                        {r.punchOut ? new Date(r.punchOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3 font-black text-blue-900 whitespace-nowrap">
                        {r.workingHours ? `${r.workingHours} hrs` : '-'}
                      </td>
                      <td className="p-3 max-w-sm">
                        {inLoc ? (
                          <button
                            onClick={() => setSelectedRecordForMap(r)}
                            className="text-left group flex items-start gap-1.5 p-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer w-full"
                            title="Click to view real-time location on interactive map"
                          >
                            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                            <div className="min-w-0">
                              <span className="font-medium text-slate-800 text-[11px] block line-clamp-2 group-hover:text-blue-700">
                                {inLoc.address || `Lat: ${inLoc.latitude.toFixed(4)}, Lng: ${inLoc.longitude.toFixed(4)}`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                {inLoc.latitude.toFixed(4)}° N, {inLoc.longitude.toFixed(4)}° E (±{inLoc.accuracy || 15}m)
                              </span>
                            </div>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-normal">No GPS Punch Recorded</span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge status={r.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Map Modal for Inspected Punch Location */}
      {selectedRecordForMap && selectedRecordForMap.punchIn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Verified GPS Location: {selectedRecordForMap.employeeName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ID: {selectedRecordForMap.employeeId} • {selectedRecordForMap.departmentName} • Date: {selectedRecordForMap.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecordForMap(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Map Canvas */}
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <MapView
                  height="300px"
                  center={[selectedRecordForMap.punchIn.latitude, selectedRecordForMap.punchIn.longitude]}
                  zoom={16}
                  punches={[
                    {
                      employeeName: selectedRecordForMap.employeeName,
                      employeeId: selectedRecordForMap.employeeId,
                      type: 'Punch In',
                      location: selectedRecordForMap.punchIn,
                      timeStr: new Date(selectedRecordForMap.punchIn.timestamp).toLocaleTimeString()
                    },
                    ...(selectedRecordForMap.punchOut
                      ? [
                          {
                            employeeName: selectedRecordForMap.employeeName,
                            employeeId: selectedRecordForMap.employeeId,
                            type: 'Punch Out' as const,
                            location: selectedRecordForMap.punchOut,
                            timeStr: new Date(selectedRecordForMap.punchOut.timestamp).toLocaleTimeString()
                          }
                        ]
                      : [])
                  ]}
                />
              </div>

              {/* Exact Location Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block">Punch In Location:</span>
                  <p className="text-slate-900 mt-0.5 font-medium">{selectedRecordForMap.punchIn.address}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Coordinates: {selectedRecordForMap.punchIn.latitude.toFixed(6)}° N, {selectedRecordForMap.punchIn.longitude.toFixed(6)}° E (Accuracy: ±{selectedRecordForMap.punchIn.accuracy}m)
                  </p>
                  {selectedRecordForMap.punchIn.deviceInfo && (
                    <p className="text-[10px] text-blue-600 font-mono mt-0.5">{selectedRecordForMap.punchIn.deviceInfo}</p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block">Punch Out Location:</span>
                  {selectedRecordForMap.punchOut ? (
                    <>
                      <p className="text-slate-900 mt-0.5 font-medium">{selectedRecordForMap.punchOut.address}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Coordinates: {selectedRecordForMap.punchOut.latitude.toFixed(6)}° N, {selectedRecordForMap.punchOut.longitude.toFixed(6)}° E (Accuracy: ±{selectedRecordForMap.punchOut.accuracy}m)
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-400 mt-1">Punch Out pending</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedRecordForMap(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
