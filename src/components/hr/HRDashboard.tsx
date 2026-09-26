import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  FileText,
  AlertCircle,
  MapPin,
  Plus,
  DollarSign,
  LogIn,
  LogOut,
  Navigation
} from 'lucide-react';
import { Employee, AttendanceRecord, LeaveRequest, TimeCorrectionRequest, OfficeLocation, CompanySettings } from '../../types';
import { dbService } from '../../services/dbService';

interface HRDashboardProps {
  onNavigateTab: (tab: string) => void;
  settings: CompanySettings;
  officeLocation: OfficeLocation;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ onNavigateTab, settings }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [pendingCorrections, setPendingCorrections] = useState<TimeCorrectionRequest[]>([]);
  const [deptFilter, setDeptFilter] = useState<string>('All');

  const reloadData = () => {
    setEmployees(dbService.getEmployees());
    setAttendance(dbService.getAttendanceRecords());
    setPendingLeaves(dbService.getLeaveRequests().filter((l) => l.status === 'Pending'));
    setPendingCorrections(dbService.getTimeCorrections().filter((c) => c.status === 'Pending'));
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const totalEmp = employees.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAtt = attendance.filter((a) => a.date === todayStr);

  const presentCount = todayAtt.length;
  const absentCount = Math.max(0, totalEmp - presentCount);

  // Combine employee list with today's attendance for the Daily Live Punch feed
  const punchFeed = employees.map((emp) => {
    const record = todayAtt.find((a) => a.employeeId === emp.employeeId);
    return {
      employee: emp,
      record
    };
  }).filter((item) => {
    if (deptFilter === 'All') return true;
    return item.employee.departmentName === deptFilter;
  });

  const handleApproveLeave = (id: string) => {
    dbService.updateLeaveStatus(id, 'Approved', 'Quick dashboard approval', 'HR Administrator');
  };

  const handleRejectLeave = (id: string) => {
    dbService.updateLeaveStatus(id, 'Rejected', 'Rejected via HR dashboard', 'HR Administrator');
  };

  const handleApproveCorrection = (id: string) => {
    dbService.updateTimeCorrectionStatus(id, 'Approved', 'Quick dashboard approval', 'HR Administrator');
  };

  const handleRejectCorrection = (id: string) => {
    dbService.updateTimeCorrectionStatus(id, 'Rejected', 'Rejected via HR dashboard', 'HR Administrator');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-500/30">
              Live Workforce Command
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Real-Time Location Tracking
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">OM Safety Services LLP • HR Dashboard</h1>
          <p className="text-xs text-slate-300 mt-1">
            Live workforce punch monitor, punch in/out verified GPS locations, and employee directory management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('hr-employees')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
          <button
            onClick={() => onNavigateTab('hr-map')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4" /> Live Map
          </button>
          <button
            onClick={() => onNavigateTab('hr-payroll')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors border border-slate-700 cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" /> Process Payroll
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Staff</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 block mt-2">{totalEmp}</span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Active Workforce</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Present Today</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-600 block mt-2">{presentCount}</span>
          <span className="text-[11px] text-slate-500 font-normal mt-1 block">GPS Punches Recorded</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Leave</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 block mt-2">{pendingLeaves.length}</span>
          <span className="text-[11px] text-slate-500 font-normal mt-1 block">Requires HR Action</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Absent / Not Punched</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-black text-rose-600 block mt-2">{absentCount}</span>
          <span className="text-[11px] text-slate-500 font-normal mt-1 block">No Punch Today</span>
        </div>
      </div>

      {/* Prominent Daily Live Punch Activity Table (Replacing Bar Graph & Headcount Distribution as requested in items 9 & 17) */}
      <div className="bg-white rounded-2xl p-6 shadow-2xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Today&apos;s Live Employee Punch In & Out Activity</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live timestamps and verified GPS addresses of daily employee punch in and punch out
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Department:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Departments</option>
              <option value="Sales Department">Sales Department</option>
              <option value="Finance Department">Finance Department</option>
              <option value="Technical Department">Technical Department</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Employee Details</th>
                <th className="py-3 px-4">Department & Shift</th>
                <th className="py-3 px-4">Punch In (Time & Live Location)</th>
                <th className="py-3 px-4">Punch Out (Time & Live Location)</th>
                <th className="py-3 px-4 text-center">Total Hours</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {punchFeed.map(({ employee: emp, record }) => {
                const hasIn = Boolean(record?.punchIn);
                const hasOut = Boolean(record?.punchOut);

                const inTime = record?.punchIn?.timestamp
                  ? new Date(record.punchIn.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })
                  : null;

                const outTime = record?.punchOut?.timestamp
                  ? new Date(record.punchOut.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })
                  : null;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                          alt={emp.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{emp.fullName}</span>
                          <span className="text-[11px] font-mono text-blue-600 font-semibold">
                            Code: {emp.employeeId} | PIN: {emp.biometricPin}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{emp.departmentName}</span>
                      <span className="text-[11px] text-slate-500 block">{emp.designationName}</span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      {hasIn ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                            <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{inTime}</span>
                          </div>
                          <div className="flex items-start gap-1 text-[11px] text-slate-600 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{record?.punchIn?.address || 'Live GPS Location'}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not Punched In</span>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      {hasOut ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-blue-700">
                            <LogOut className="w-3.5 h-3.5 text-blue-600" />
                            <span>{outTime}</span>
                          </div>
                          <div className="flex items-start gap-1 text-[11px] text-slate-600 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{record?.punchOut?.address || 'Live GPS Location'}</span>
                          </div>
                        </div>
                      ) : hasIn ? (
                        <span className="text-amber-600 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block">
                          Active Working (No Punch Out Yet)
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-900">
                        {record?.workingHours ? `${record.workingHours} hrs` : hasIn ? 'In Progress' : '0.00 hrs'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {hasIn ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Present (Full Day)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                          Not Punched
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {punchFeed.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No employees registered in this department.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Approvals Action Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leaves */}
        <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Pending Leave Approvals ({pendingLeaves.length})
            </h3>
            <button
              onClick={() => onNavigateTab('hr-leaves')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              View All Leaves
            </button>
          </div>

          {pendingLeaves.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No pending leave requests requiring approval.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingLeaves.map((l) => (
                <div key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900">{l.employeeName} ({l.departmentName})</span>
                    <span className="text-xs text-slate-600 block mt-0.5">
                      <strong>{l.leaveType}</strong> from {l.fromDate} to {l.toDate} ({l.totalDays} Days)
                    </span>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">&quot;{l.reason}&quot;</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveLeave(l.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectLeave(l.id)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Time Corrections */}
        <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Pending Time Corrections ({pendingCorrections.length})
            </h3>
            <button
              onClick={() => onNavigateTab('hr-corrections')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              View All Corrections
            </button>
          </div>

          {pendingCorrections.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No pending time correction requests requiring approval.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingCorrections.map((c) => (
                <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900">{c.employeeName} ({c.departmentName})</span>
                    <span className="text-xs text-slate-600 block mt-0.5">
                      Target Date: <strong>{c.date}</strong> | In: <strong className="text-emerald-700">{c.requestedPunchIn || '-'}</strong> | Out: <strong className="text-blue-700">{c.requestedPunchOut || '-'}</strong>
                    </span>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">&quot;{c.reason}&quot;</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveCorrection(c.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectCorrection(c.id)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
