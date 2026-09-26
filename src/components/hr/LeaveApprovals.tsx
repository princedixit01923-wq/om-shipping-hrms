import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, MessageSquare, Search } from 'lucide-react';
import { LeaveRequest } from '../../types';
import { dbService } from '../../services/dbService';
import { Badge } from '../common/Badge';

export const LeaveApprovals: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [commentModalReq, setCommentModalReq] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'Approved' | 'Rejected'>('Approved');
  const [hrComment, setHrComment] = useState('');

  const reloadData = () => {
    setLeaves(dbService.getLeaveRequests());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const pendingCount = leaves.filter((l) => l.status === 'Pending').length;

  // Sort newest first
  const sortedLeaves = [...leaves].sort((a, b) => {
    const tA = new Date(a.createdAt || a.fromDate).getTime();
    const tB = new Date(b.createdAt || b.fromDate).getTime();
    return tB - tA;
  });

  const filteredLeaves = sortedLeaves.filter((l) => {
    const matchesFilter = selectedFilter === 'All' ? true : l.status === selectedFilter;
    const matchesSearch =
      l.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenActionModal = (req: LeaveRequest, action: 'Approved' | 'Rejected') => {
    setCommentModalReq(req);
    setActionType(action);
    setHrComment(action === 'Approved' ? 'Leave approved based on team coverage.' : 'Leave rejected due to ongoing critical project phase.');
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentModalReq) return;
    dbService.updateLeaveStatus(commentModalReq.id, actionType, hrComment, 'HR Administrator');
    setCommentModalReq(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0f4c81]" /> Leave Request Approvals
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-black bg-rose-600 text-white rounded-full animate-pulse shadow-xs">
                {pendingCount} Pending
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review leave applications, verify balances, and record HR comments</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff, leave type, reason..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f4c81]"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto justify-center">
            {(['Pending', 'Approved', 'Rejected', 'All'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  selectedFilter === tab ? 'bg-[#0f4c81] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                <th className="p-3">Employee</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">Period</th>
                <th className="p-3">Days</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No leave requests found in queue.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-extrabold text-slate-900 block">{l.employeeName}</span>
                      <span className="text-[10px] text-slate-500 block">{l.departmentName}</span>
                    </td>
                    <td className="p-3 font-bold text-[#0f4c81]">{l.leaveType}</td>
                    <td className="p-3">{l.fromDate} → {l.toDate}</td>
                    <td className="p-3 font-extrabold">{l.totalDays} Days</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{l.reason}</td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <Badge status={l.status} />
                        {l.hrComment && <span className="text-[10px] text-slate-500 block italic">"{l.hrComment}"</span>}
                      </div>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {l.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleOpenActionModal(l, 'Approved')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(l, 'Rejected')}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {commentModalReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-1">
              Confirm Leave {actionType} - {commentModalReq.employeeName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Add mandatory HR audit comment before finalizing decision</p>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">HR Reviewer Comment</label>
                <textarea
                  required
                  rows={3}
                  value={hrComment}
                  onChange={(e) => setHrComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCommentModalReq(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-md ${
                    actionType === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {actionType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
