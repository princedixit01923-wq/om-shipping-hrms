import React, { useState, useEffect } from 'react';
import { Calendar, User as UserIcon, Building2, MapPin, Clock, FileText, Megaphone, ShieldCheck } from 'lucide-react';
import { Employee, AttendanceRecord, OfficeLocation, CompanySettings, Announcement } from '../../types';
import { dbService } from '../../services/dbService';
import { GPSPunchCard } from './GPSPunchCard';
import { Badge } from '../common/Badge';

interface EmployeeDashboardProps {
  employee: Employee;
  settings: CompanySettings;
  officeLocation: OfficeLocation;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  employee,
  settings,
  officeLocation
}) => {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | undefined>();
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const safeEmployeeId = employee?.employeeId || 'OM0001';

  const reloadData = () => {
    try {
      setTodayRecord(dbService.getTodayAttendanceForEmployee(safeEmployeeId));
      const all = dbService.getAttendanceRecords().filter(
        (r) => r.employeeId === safeEmployeeId || (employee?.biometricPin && r.biometricPin === employee.biometricPin)
      );
      setRecentRecords(all.slice(0, 5));
      setAnnouncements(dbService.getAnnouncements().slice(0, 3));
    } catch (err) {
      console.warn('Dashboard data load notice:', err);
    }
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, [safeEmployeeId]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6">
      {/* Modern Executive Greeting Banner */}
      <div className="bg-slate-900 rounded-xl p-6 text-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <img
            src={employee?.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
            alt={employee?.fullName || 'Employee'}
            className="w-14 h-14 rounded-full object-cover border-2 border-white/20 shadow-xs"
          />
          <div>
            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider block">
              {getGreeting()},
            </span>
            <h1 className="text-xl font-bold tracking-tight mt-0.5">{employee?.fullName || 'Employee Member'}</h1>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 mt-1">
              <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-[11px]">ID: {safeEmployeeId}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                {employee?.departmentName || 'Technical Department'}
              </span>
              <span>•</span>
              <span className="font-normal">{employee?.designationName || 'Staff Member'}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-3.5 border border-slate-700 text-center min-w-[190px] z-10">
          <span className="text-[10px] font-medium text-slate-300 block uppercase tracking-wider">Shift Schedule</span>
          <span className="text-xs font-bold text-white block mt-0.5">{employee?.shiftName || 'Flexible Shift'}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Flexible Anytime Punch / Shift A</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live GPS Location Punch */}
        <div className="lg:col-span-2">
          <GPSPunchCard
            employee={employee}
            todayRecord={todayRecord}
            officeLocation={officeLocation}
            settings={settings}
            onPunchSuccess={reloadData}
          />
        </div>

        {/* Right Col: Today Status & Company Circulars */}
        <div className="space-y-6">
          {/* Today's Status Box */}
          <div className="bg-white rounded-xl p-5 shadow-2xs border border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Today's Punch Status
            </h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    {todayRecord?.status || 'Not Punched In'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {todayRecord?.punchIn
                      ? `Punched In at ${new Date(todayRecord.punchIn.timestamp).toLocaleTimeString()}`
                      : 'Awaiting Punch In'}
                  </span>
                </div>
              </div>
              <Badge status={todayRecord?.status || 'Draft'} />
            </div>

            <div className="mt-4 space-y-2 text-xs font-medium text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Punch Location:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[160px]">
                  {todayRecord?.punchIn?.address || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Working Hours:</span>
                <span className="font-bold text-blue-600">
                  {todayRecord?.workingHours ? `${todayRecord.workingHours} hrs` : 'In Progress'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Location Verification:</span>
                <span className="font-semibold text-emerald-600">
                  {todayRecord?.punchIn ? '✓ Verified GPS' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Company Notices */}
          <div className="bg-white rounded-xl p-5 shadow-2xs border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-blue-600" />
                Corporate Notices
              </h3>
            </div>
            <div className="space-y-2.5">
              {announcements.map((anc) => (
                <div key={anc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">{anc.title}</span>
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                      {anc.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{anc.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-xl p-5 shadow-2xs border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          Recent Attendance History
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b border-slate-200">
                <th className="p-3">Date</th>
                <th className="p-3">Punch In</th>
                <th className="p-3">Punch Out</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Recorded Location</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800 font-medium">
              {recentRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">{r.date}</td>
                  <td className="p-3">
                    {r.punchIn ? new Date(r.punchIn.timestamp).toLocaleTimeString() : '-'}
                  </td>
                  <td className="p-3">
                    {r.punchOut ? new Date(r.punchOut.timestamp).toLocaleTimeString() : '-'}
                  </td>
                  <td className="p-3 text-blue-600 font-semibold">
                    {r.workingHours ? `${r.workingHours} hrs` : '-'}
                  </td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">
                    {r.punchIn?.address || 'N/A'}
                  </td>
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
