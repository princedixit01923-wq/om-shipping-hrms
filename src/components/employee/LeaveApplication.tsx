import React, { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, CheckCircle2, Clock, XCircle, Paperclip } from 'lucide-react';
import { Employee, LeaveRequest, LeaveType } from '../../types';
import { dbService } from '../../services/dbService';
import { Badge } from '../common/Badge';

interface LeaveApplicationProps {
  employee: Employee;
}

export const LeaveApplication: React.FC<LeaveApplicationProps> = ({ employee }) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual Leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const reloadLeaves = () => {
    const list = dbService.getLeaveRequests().filter((r) => r.employeeId === employee.employeeId);
    setLeaves(list);
  };

  useEffect(() => {
    reloadLeaves();
    const unsub = dbService.subscribe(reloadLeaves);
    return () => unsub();
  }, [employee.employeeId]);

  const calculateDays = () => {
    if (!fromDate || !toDate) return 1;
    const start = new Date(fromDate).getTime();
    const end = new Date(toDate).getTime();
    if (end < start) return 1;
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate || !reason) {
      alert('Please fill out all required fields.');
      return;
    }

    const totalDays = calculateDays();
    const newReq: LeaveRequest = {
      id: `lv-${Date.now()}`,
      employeeId: employee.employeeId,
      employeeName: employee.fullName,
      departmentName: employee.departmentName,
      leaveType,
      fromDate,
      toDate,
      totalDays,
      reason,
      attachmentName: attachmentName || undefined,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    dbService.addLeaveRequest(newReq);
    setShowApplyModal(false);
    setFromDate('');
    setToDate('');
    setReason('');
    setAttachmentName('');
  };

  const balances = {
    casual: { total: 12, used: 2, remaining: 10 },
    sick: { total: 10, used: 1, remaining: 9 },
    earned: { total: 15, used: 3, remaining: 12 },
    paid: { total: 5, used: 0, remaining: 5 }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-md border border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Leave Management</h1>
          <p className="text-xs text-slate-500 mt-1">Apply for leave and track HR approval status</p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0f4c81] hover:bg-[#0055a5] text-white text-xs font-bold rounded-xl shadow-md transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Apply For Leave
        </button>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Casual Leave (CL)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-[#0f4c81]">{balances.casual.remaining}</span>
            <span className="text-xs text-slate-500 font-semibold">Of {balances.casual.total} Days</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Sick Leave (SL)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-rose-600">{balances.sick.remaining}</span>
            <span className="text-xs text-slate-500 font-semibold">Of {balances.sick.total} Days</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Earned Leave (EL)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600">{balances.earned.remaining}</span>
            <span className="text-xs text-slate-500 font-semibold">Of {balances.earned.total} Days</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Paid Leave (PL)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-purple-600">{balances.paid.remaining}</span>
            <span className="text-xs text-slate-500 font-semibold">Of {balances.paid.total} Days</span>
          </div>
        </div>
      </div>

      {/* Leave Application History Table */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
        <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#0055a5]" /> My Leave Application Requests
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                <th className="p-3">Applied On</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">From Date</th>
                <th className="p-3">To Date</th>
                <th className="p-3">Total Days</th>
                <th className="p-3">Reason</th>
                <th className="p-3">HR Status & Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                    No leave requests submitted yet.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500">{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-[#0f4c81]">{l.leaveType}</td>
                    <td className="p-3">{l.fromDate}</td>
                    <td className="p-3">{l.toDate}</td>
                    <td className="p-3 font-extrabold">{l.totalDays} Days</td>
                    <td className="p-3 max-w-xs truncate text-slate-600">{l.reason}</td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <Badge status={l.status} />
                        {l.hrComment && (
                          <span className="text-[10px] text-slate-500 block italic">"{l.hrComment}"</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-1">New Leave Application</h3>
            <p className="text-xs text-slate-500 mb-4">Submit leave details for manager & HR approval</p>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
                >
                  <option value="Casual Leave">Casual Leave (CL)</option>
                  <option value="Sick Leave">Sick Leave (SL)</option>
                  <option value="Earned Leave">Earned Leave (EL)</option>
                  <option value="Paid Leave">Paid Leave (PL)</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Leave</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain brief reason for leave request..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attachment (Optional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="Medical_Certificate.pdf"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f4c81] hover:bg-[#0055a5] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
