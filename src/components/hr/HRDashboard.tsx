import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  FileText,
  AlertCircle,
  MapPin,
  TrendingUp,
  Plus,
  DollarSign,
  BarChart2
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Employee, AttendanceRecord, LeaveRequest, TimeCorrectionRequest, OfficeLocation, CompanySettings } from '../../types';
import { dbService } from '../../services/dbService';
import { Badge } from '../common/Badge';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface HRDashboardProps {
  onNavigateTab: (tab: string) => void;
  settings: CompanySettings;
  officeLocation: OfficeLocation;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ onNavigateTab, settings, officeLocation }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [pendingCorrections, setPendingCorrections] = useState<TimeCorrectionRequest[]>([]);

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

  const presentCount = todayAtt.filter((a) => a.status === 'Present').length;
  const absentCount = totalEmp - presentCount;
  const lateCount = todayAtt.filter((a) => a.isLate).length;

  // Chart Data
  const doughnutData = {
    labels: ['Present Today', 'Absent / Off', 'Pending Leave'],
    datasets: [
      {
        data: [presentCount || 1, absentCount || 1, pendingLeaves.length || 0],
        backgroundColor: ['#16a34a', '#dc2626', '#f59e0b'],
        borderWidth: 0
      }
    ]
  };

  const deptCounts: { [key: string]: number } = {};
  employees.forEach((e) => {
    deptCounts[e.departmentName] = (deptCounts[e.departmentName] || 0) + 1;
  });

  const barData = {
    labels: Object.keys(deptCounts),
    datasets: [
      {
        label: 'Employees per Department',
        data: Object.values(deptCounts),
        backgroundColor: '#0055a5',
        borderRadius: 8
      }
    ]
  };

  const handleApproveLeave = (id: string) => {
    dbService.updateLeaveStatus(id, 'Approved', 'Quick dashboard approval', 'HR Admin');
  };

  const handleRejectLeave = (id: string) => {
    dbService.updateLeaveStatus(id, 'Rejected', 'Rejected via HR dashboard', 'HR Admin');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900 p-6 rounded-xl text-white shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">HR Command & Analytics Dashboard</h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time workforce metrics, GPS attendance tracking, and pending authorization queue
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('hr-employees')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
          <button
            onClick={() => onNavigateTab('hr-map')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors"
          >
            <MapPin className="w-4 h-4" /> GPS Map
          </button>
          <button
            onClick={() => onNavigateTab('hr-payroll')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors border border-slate-700"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" /> Process Payroll
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Employees</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block mt-2">{totalEmp}</span>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Active Workforce</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Present Today</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-emerald-600 block mt-2">{presentCount}</span>
          <span className="text-[11px] text-slate-500 font-normal mt-1 block">GPS Punch Verified</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Leave</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-bold text-amber-600 block mt-2">{pendingLeaves.length}</span>
          <span className="text-[11px] text-slate-500 font-normal mt-1 block">Requires HR Action</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Time Corrections</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-blue-600 block mt-2">{pendingCorrections.length}</span>
          <span className="text-[11px] text-slate-500 font-normal mt-1 block">Biometric / GPS Override</span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Today's Attendance Ratio
          </h3>
          <div className="h-48 flex items-center justify-center">
            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Department Headcount Distribution
          </h3>
          <div className="h-48">
            <Bar data={barData} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>
      </div>

      {/* Pending Approvals Action Queue */}
      <div className="bg-white rounded-xl p-5 shadow-2xs border border-slate-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" /> Pending Leave Approvals Queue
          </h3>
          <button
            onClick={() => onNavigateTab('hr-leaves')}
            className="text-xs font-medium text-blue-600 hover:underline"
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
                  <span className="font-semibold text-xs text-slate-900">{l.employeeName} ({l.departmentName})</span>
                  <span className="text-xs text-slate-600 block mt-0.5">
                    <strong>{l.leaveType}</strong> from {l.fromDate} to {l.toDate} ({l.totalDays} Days)
                  </span>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">"{l.reason}"</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveLeave(l.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectLeave(l.id)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-md transition-colors"
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
  );
};
