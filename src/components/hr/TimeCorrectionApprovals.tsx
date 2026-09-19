import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { TimeCorrectionRequest } from '../../types';
import { dbService } from '../../services/dbService';
import { Badge } from '../common/Badge';

export const TimeCorrectionApprovals: React.FC = () => {
  const [corrections, setCorrections] = useState<TimeCorrectionRequest[]>([]);

  const reloadData = () => {
    setCorrections(dbService.getTimeCorrections());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const handleApprove = (id: string) => {
    dbService.updateTimeCorrectionStatus(id, 'Approved', 'Corrected attendance verified by HR', 'Meera Sharma (HR Lead)');
  };

  const handleReject = (id: string) => {
    dbService.updateTimeCorrectionStatus(id, 'Rejected', 'Reason invalid or unverified', 'Meera Sharma (HR Lead)');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#0055a5]" /> Time Correction Request Approvals
        </h1>
        <p className="text-xs text-slate-500 mt-1">Review biometric scanner or GPS connection failure correction logs</p>
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
              {corrections.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <span className="font-extrabold text-slate-900 block">{c.employeeName}</span>
                    <span className="text-[10px] text-slate-500 block">{c.departmentName}</span>
                  </td>
                  <td className="p-3 font-bold">{c.date}</td>
                  <td className="p-3 text-emerald-700 font-bold">{c.requestedPunchIn}</td>
                  <td className="p-3 text-blue-700 font-bold">{c.requestedPunchOut}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
