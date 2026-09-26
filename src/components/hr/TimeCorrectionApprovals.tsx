import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { TimeCorrectionRequest } from '../../types';
import { dbService } from '../../services/dbService';
import { Badge } from '../common/Badge';

export const TimeCorrectionApprovals: React.FC = () => {
  const [corrections, setCorrections] = useState<TimeCorrectionRequest[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  const reloadData = () => {
    setCorrections(dbService.getTimeCorrections());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const pendingCount = corrections.filter((c) => c.status === 'Pending').length;

  // Sort newest first
  const sortedCorrections = [...corrections].sort((a, b) => {
    const tA = new Date(a.createdAt || a.date).getTime();
    const tB = new Date(b.createdAt || b.date).getTime();
    return tB - tA;
  });

  const filteredCorrections = sortedCorrections.filter((c) => {
    const matchesFilter = selectedFilter === 'All' ? true : c.status === selectedFilter;
    const matchesSearch =
      c.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.date.includes(searchQuery) ||
      c.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = (id: string) => {
    dbService.updateTimeCorrectionStatus(id, 'Approved', 'Corrected attendance verified by HR', 'HR Administrator');
  };

  const handleReject = (id: string) => {
    dbService.updateTimeCorrectionStatus(id, 'Rejected', 'Reason invalid or unverified', 'HR Administrator');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0055a5]" /> Time Correction Request Approvals
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-black bg-rose-600 text-white rounded-full animate-pulse shadow-xs">
                {pendingCount} Pending
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review punch in / punch out correction logs submitted by employees</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff, date, reason..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto justify-center">
            {(['Pending', 'Approved', 'Rejected', 'All'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                  selectedFilter === tab ? 'bg-[#0055a5] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                <th className="p-3">Staff Member</th>
                <th className="p-3">Date</th>
                <th className="p-3">Requested Punch In</th>
                <th className="p-3">Requested Punch Out</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {filteredCorrections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No time correction requests found in queue.
                  </td>
                </tr>
              ) : (
                filteredCorrections.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-extrabold text-slate-900 block">{c.employeeName}</span>
                      <span className="text-[10px] text-slate-500 block">{c.departmentName} ({c.employeeId})</span>
                    </td>
                    <td className="p-3 font-bold">{c.date}</td>
                    <td className="p-3 text-emerald-700 font-bold">{c.requestedPunchIn || '-'}</td>
                    <td className="p-3 text-blue-700 font-bold">{c.requestedPunchOut || '-'}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{c.reason}</td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <Badge status={c.status} />
                        {c.hrComment && <span className="text-[10px] text-slate-500 block italic">"{c.hrComment}"</span>}
                      </div>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {c.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(c.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(c.id)}
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
    </div>
  );
};
