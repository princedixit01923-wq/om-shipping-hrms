import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileSpreadsheet, Search, Calendar, User as UserIcon } from 'lucide-react';
import { Employee, AttendanceRecord } from '../../types';
import { dbService } from '../../services/dbService';
import { exportAttendanceToExcel } from '../../services/exportService';

export const ReportsViewer: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day'>('Month');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');

  const reloadData = () => {
    setEmployees(dbService.getEmployees());
    setAttendance(dbService.getAttendanceRecords());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const filteredEmployees = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.biometricPin?.includes(searchQuery) ||
      e.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate days for selected month matrix (e.g. Sept 1 to Sept 30)
  const getDaysInMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const days: { dateStr: string; dayNum: number; dayName: string }[] = [];

    while (date.getMonth() === month - 1) {
      const dNum = date.getDate();
      const dName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({ dateStr: dStr, dayNum: dNum, dayName: dName });
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const allDays = getDaysInMonth(selectedMonth);

  // Filter days if in Week or Day mode
  const displayedDays = viewMode === 'Day' ? allDays.slice(18, 19) : viewMode === 'Week' ? allDays.slice(14, 21) : allDays;

  const handleExportExcel = () => {
    exportAttendanceToExcel(attendance, `Agent_Attendance_Matrix_${selectedMonth}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Matrix Filters */}
      <div className="card-3d p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> Agent Attendance Matrix Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">Multi-view attendance grid with stats breakdown (Day, Week, Month)</p>
        </div>

        {/* View Mode & Actions Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            {(['Month', 'Week', 'Day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === mode
                    ? 'btn-3d-primary shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode} View
              </button>
            ))}
          </div>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 shadow-2xs"
          />

          <button
            onClick={handleExportExcel}
            className="btn-3d-emerald flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel Matrix
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="card-3d p-4 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee or PIN..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <span className="text-xs font-bold text-slate-500 hidden sm:block">
          Displaying {filteredEmployees.length} Agent Records ({viewMode} Matrix)
        </span>
      </div>

      {/* Agent Attendance Records Matrix Table */}
      <div className="card-3d p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-blue-50 rounded-xl text-blue-600 shadow-2xs">
              <Calendar className="w-4 h-4" />
            </span>
            Agent Attendance Records ({selectedMonth})
          </h3>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[11px] font-black uppercase border-b border-slate-200">
                <th className="p-3.5 sticky left-0 bg-slate-50 z-10 w-56 border-r border-slate-200 shadow-xs">
                  EMPLOYEE DETAILS
                </th>
                <th className="p-2 text-center text-emerald-700 bg-emerald-50/70">PRESENT</th>
                <th className="p-2 text-center text-amber-700 bg-amber-50/70">LATE</th>
                <th className="p-2 text-center text-orange-700 bg-orange-50/70">HALF DAY</th>
                <th className="p-2 text-center text-rose-700 bg-rose-50/70">ABSENT</th>
                <th className="p-2 text-center text-blue-700 bg-blue-50/70 border-r border-slate-200">LEAVE</th>

                {displayedDays.map((d) => (
                  <th key={d.dateStr} className="p-2 text-center text-[10px] font-black text-slate-700 min-w-[54px]">
                    <span className="block text-[9px] text-slate-400 font-bold">{d.dayName}</span>
                    <span className="block font-black text-slate-900">{d.dayNum}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold">
              {filteredEmployees.map((emp) => {
                const empAtt = attendance.filter((a) => a.employeeId === emp.employeeId);
                const presentCount = empAtt.filter((a) => a.status === 'Present').length;
                const lateCount = empAtt.filter((a) => a.isLate).length;
                const halfDayCount = empAtt.filter((a) => a.status === 'Half Day').length;
                const absentCount = 30 - presentCount;
                const leaveCount = empAtt.filter((a) => a.status === 'On Leave').length;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Employee Details Column */}
                    <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-indigo-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                          {(emp.firstName || emp.fullName || 'E').charAt(0)}{(emp.lastName || '').charAt(0)}
                        </div>
                        <div className="truncate">
                          <span className="font-extrabold text-slate-900 block truncate">{emp.fullName}</span>
                          <span className="text-[10px] font-bold text-slate-500 block">PIN: {emp.biometricPin}</span>
                        </div>
                      </div>
                    </td>

                    {/* Stats Columns */}
                    <td className="p-2 text-center font-black text-emerald-600 bg-emerald-50/40">{presentCount}</td>
                    <td className="p-2 text-center font-black text-amber-600 bg-amber-50/40">{lateCount}</td>
                    <td className="p-2 text-center font-black text-orange-600 bg-orange-50/40">{halfDayCount}</td>
                    <td className="p-2 text-center font-black text-rose-600 bg-rose-50/40">{absentCount}</td>
                    <td className="p-2 text-center font-black text-blue-600 bg-blue-50/40 border-r border-slate-200">{leaveCount}</td>

                    {/* Matrix Day Columns */}
                    {displayedDays.map((d) => {
                      const rec = empAtt.find((a) => a.date === d.dateStr);
                      const isSunday = d.dayName === 'SUN';
                      
                      let badgeChar = 'A';
                      let badgeStyle = 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_2px_8px_rgba(244,63,94,0.35)]';
                      let timeText = '--';

                      if (isSunday) {
                        badgeChar = 'WO';
                        badgeStyle = 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 shadow-2xs';
                      } else if (rec) {
                        if (rec.status === 'Present') {
                          badgeChar = rec.isLate ? 'L' : 'P';
                          badgeStyle = rec.isLate
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.35)]'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]';
                          const inT = rec.punchIn ? new Date(rec.punchIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                          const outT = rec.punchOut ? new Date(rec.punchOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                          timeText = inT && outT ? `${inT} ${outT}` : inT || '--';
                        } else if (rec.status === 'Half Day') {
                          badgeChar = 'HD';
                          badgeStyle = 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-[0_2px_8px_rgba(249,115,22,0.35)]';
                        } else if (rec.status === 'On Leave') {
                          badgeChar = 'LV';
                          badgeStyle = 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]';
                        }
                      }

                      return (
                        <td key={d.dateStr} className="p-2 text-center align-middle">
                          <div className="flex flex-col items-center justify-center">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] badge-3d transition-transform hover:scale-110 ${badgeStyle}`}
                            >
                              {badgeChar}
                            </span>
                            {timeText !== '--' && (
                              <span className="text-[8px] font-mono text-slate-500 mt-1 block leading-tight font-bold">
                                {timeText}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
