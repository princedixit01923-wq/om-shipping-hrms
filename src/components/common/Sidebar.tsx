import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  FileText,
  Clock,
  CalendarDays,
  CreditCard,
  Users,
  Sliders,
  DollarSign,
  Megaphone,
  BarChart3,
  ShieldAlert,
  UserCheck,
  Settings
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: UserRole;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  mobileOpen,
  onCloseMobile
}) => {
  const isHR = userRole === 'HR Administrator';

  const employeeNav = [
    { id: 'emp-dashboard', label: 'Dashboard & GPS Punch', icon: LayoutDashboard },
    { id: 'emp-profile', label: 'My Profile & Details', icon: UserCheck },
    { id: 'emp-attendance', label: 'My Attendance Logs', icon: CalendarCheck },
    { id: 'emp-leaves', label: 'Leave Applications', icon: FileText },
    { id: 'emp-corrections', label: 'Time Corrections', icon: Clock },
    { id: 'emp-holidays', label: 'Holiday Calendar', icon: CalendarDays },
    { id: 'emp-payslips', label: 'My Payslips', icon: CreditCard },
    { id: 'emp-announcements', label: 'Company Circulars', icon: Megaphone }
  ];

  const hrNav = [
    { id: 'hr-dashboard', label: 'HR Analytics Dashboard', icon: LayoutDashboard },
    { id: 'hr-map', label: 'Live Location Map', icon: MapPin },
    { id: 'hr-attendance', label: 'Attendance Management', icon: CalendarCheck },
    { id: 'hr-reports', label: 'Attendance Reports (Matrix)', icon: BarChart3 },
    { id: 'hr-leaves', label: 'Leave Approvals', icon: FileText },
    { id: 'hr-corrections', label: 'Time Correction Approvals', icon: Clock },
    { id: 'hr-employees', label: 'Employee Directory', icon: Users },
    { id: 'hr-payroll', label: 'Payroll & Payslips', icon: DollarSign },
    { id: 'hr-shifts', label: 'Shift Schedules', icon: Sliders },
    { id: 'hr-announcements', label: 'Announcements', icon: Megaphone },
    { id: 'hr-audit', label: 'Security Audit Logs', icon: ShieldAlert },
    { id: 'hr-settings', label: 'System Settings', icon: Settings }
  ];

  const currentNav = isHR ? hrNav : employeeNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        ></div>
      )}

      {/* Fixed Sticky Left Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 z-30 w-64 h-full bg-[#0f172a] text-slate-100 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header Banner */}
          <div className="px-4 py-3 border-b border-slate-800/80 bg-[#090d16] shrink-0">
            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest block">
              {isHR ? 'ADMINISTRATION' : 'EMPLOYEE PORTAL'}
            </span>
            <span className="text-xs font-bold text-white block mt-0.5">
              {isHR ? 'HR Administrator' : 'Employee Portal'}
            </span>
          </div>

          {/* Nav List */}
          <div className="flex-1 p-3 space-y-1">
            {currentNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#2563eb] text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Footer Branding */}
          <div className="p-3.5 border-t border-slate-800 bg-[#090d16] text-center shrink-0">
            <span className="text-xs font-bold text-white tracking-tight block">
              OM Shipping Ltd.
            </span>
            <span className="text-[10px] font-normal text-sky-400 uppercase tracking-widest block mt-0.5">
              HRMS By Priva
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
