import React from 'react';
import { AttendanceStatus } from '../../types';

interface BadgeProps {
  status: AttendanceStatus | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Active' | 'Inactive' | 'Disabled' | 'Draft' | 'Finalized' | 'Paid' | 'High' | 'Medium' | 'Low' | 'Urgent';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  let styleClasses = 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300';

  switch (status) {
    case 'Present':
    case 'Approved':
    case 'Active':
    case 'Paid':
    case 'Finalized':
      styleClasses = 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-[0_2px_8px_rgba(16,185,129,0.35)]';
      break;
    case 'Absent':
    case 'Rejected':
    case 'Disabled':
    case 'Inactive':
    case 'Urgent':
    case 'High':
      styleClasses = 'bg-gradient-to-r from-rose-500 to-red-600 text-white border-rose-400 shadow-[0_2px_8px_rgba(244,63,94,0.35)]';
      break;
    case 'Late':
    case 'Half Day':
    case 'Pending':
    case 'Medium':
      styleClasses = 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-amber-300 shadow-[0_2px_8px_rgba(245,158,11,0.35)]';
      break;
    case 'On Leave':
    case 'Leave':
    case 'Holiday':
    case 'Weekly Off':
    case 'Cancelled':
      styleClasses = 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-400 shadow-[0_2px_8px_rgba(59,130,246,0.35)]';
      break;
    case 'Draft':
    case 'Low':
      styleClasses = 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border badge-3d transition-transform hover:scale-105 ${styleClasses} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 shadow-2xs"></span>
      {status}
    </span>
  );
};
