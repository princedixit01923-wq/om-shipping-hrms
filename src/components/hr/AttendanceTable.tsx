import React, { useState, useEffect } from 'react';
import { CalendarCheck, Search, Download, Edit, MapPin } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../../types';
import { dbService } from '../../services/dbService';
import { exportAttendanceToExcel } from '../../services/exportService';
import { Badge } from '../common/Badge';

export const AttendanceTable: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDate, setSelectedDate] = useState('2026-09-19');

  const reloadData = () => {
    setAttendance(dbService.getAttendanceRecords());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const filtered = attendance.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || r.departmentName === selectedDept;
    const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;
    const matchesDate = !selectedDate || r.date === selectedDate;
    return matchesSearch && matchesDept && matchesStatus && matchesDate;
  });

  const handleExportExcel = () => {
    exportAttendanceToExcel(filtered, `Attendance_Log_${selectedDate || 'Report'}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card-3d bg-white p-6 rounded-3xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" /> Attendance Records & Shift Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">Audit daily punches, working hours, geofence status, and manual overrides</p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs hover:shadow-xs active:translate-y-0.5 self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-600" /> Export Attendance Excel
        </button>
      </div>

      <div className="card-3d bg-white p-4 rounded-3xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee or ID..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
          />
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
          >
            <option value="All">All Departments</option>
            <option value="Fleet Operations">Fleet Operations</option>
            <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Maritime IT & Systems">Maritime IT & Systems</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="card-3d bg-white rounded-3xl p-6 border border-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                <th className="p-3">Date</th>
                <th className="p-3">Staff Member</th>
                <th className="p-3">Punch In</th>
                <th className="p-3">Punch Out</th>
                <th className="p-3">Working Hours</th>
                <th className="p-3">GPS Address</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">{r.date}</td>
                  <td className="p-3">
                    <span className="font-extrabold text-slate-900 block">{r.employeeName}</span>
                    <span className="text-[10px] text-slate-500 block">{r.employeeId}</span>
                  </td>
                  <td className="p-3 text-emerald-700 font-bold">
                    {r.punchIn ? new Date(r.punchIn.timestamp).toLocaleTimeString() : '-'}
                  </td>
                  <td className="p-3 text-blue-700 font-bold">
                    {r.punchOut ? new Date(r.punchOut.timestamp).toLocaleTimeString() : '-'}
                  </td>
                  <td className="p-3 font-black text-[#0f4c81]">
                    {r.workingHours ? `${r.workingHours} hrs` : '-'}
                  </td>
                  <td className="p-3 text-slate-500 max-w-xs truncate">{r.punchIn?.address || 'N/A'}</td>
                  <td className="p-3">
                    <Badge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
