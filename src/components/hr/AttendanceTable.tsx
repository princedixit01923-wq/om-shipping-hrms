import React, { useState, useEffect } from 'react';
import { CalendarCheck, Search, Download, Calendar, Filter, RotateCcw } from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { dbService } from '../../services/dbService';
import { exportAttendanceToExcel } from '../../services/exportService';
import { Badge } from '../common/Badge';

export const AttendanceTable: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDate, setSelectedDate] = useState(''); // Default empty = All dates

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
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="card-3d bg-white p-6 rounded-3xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" /> Attendance Records & Shift Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">Audit daily GPS punches, working hours, field staff flexible credit, and manual overrides</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportFilteredExcel}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all shadow-2xs hover:shadow-xs active:translate-y-0.5"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Filtered ({filtered.length})</span>
          </button>

          <button
            onClick={handleExportAllExcel}
            className="btn-3d-emerald flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Export All ({attendance.length})</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card-3d bg-white p-4 rounded-3xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
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
            className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
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
            title="Filter by date (leave empty for all)"
            className="flex-1 px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="p-2.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Clear date filter (show all dates)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="card-3d bg-white rounded-3xl p-6 border border-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                <th className="p-3">Date</th>
                <th className="p-3">Staff Member</th>
                <th className="p-3">Category</th>
                <th className="p-3">Punch In</th>
                <th className="p-3">Punch Out</th>
                <th className="p-3">Working Hours</th>
                <th className="p-3">GPS Location</th>
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
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold">{r.date}</td>
                      <td className="p-3">
                        <span className="font-extrabold text-slate-900 block">{r.employeeName}</span>
                        <span className="text-[10px] text-slate-500 block">{r.employeeId}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            isField
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isField ? 'Field Staff' : 'Office Staff'}
                        </span>
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
                      <td className="p-3 text-slate-500 max-w-xs truncate" title={r.punchIn?.address || 'N/A'}>
                        {r.punchIn?.address || 'N/A'}
                      </td>
                      <td className="p-3">
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
    </div>
  );
};
