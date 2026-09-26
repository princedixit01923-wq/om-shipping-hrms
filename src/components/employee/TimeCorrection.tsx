import React, { useState, useEffect } from 'react';
import { Clock, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { Employee, TimeCorrectionRequest } from '../../types';
import { dbService } from '../../services/dbService';
import { Badge } from '../common/Badge';

interface TimeCorrectionProps {
  employee: Employee;
}

export const TimeCorrection: React.FC<TimeCorrectionProps> = ({ employee }) => {
  const [corrections, setCorrections] = useState<TimeCorrectionRequest[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [date, setDate] = useState('');
  const [correctionType, setCorrectionType] = useState<'Punch In Only' | 'Punch Out Only' | 'Both'>('Punch In Only');
  const [requestedPunchIn, setRequestedPunchIn] = useState('09:30');
  const [requestedPunchOut, setRequestedPunchOut] = useState('18:30');
  const [reason, setReason] = useState('');

  const reloadData = () => {
    const list = dbService.getTimeCorrections().filter((c) => c.employeeId === employee.employeeId);
    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    setCorrections(list);
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, [employee.employeeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !reason) {
      alert('Please fill out all required fields.');
      return;
    }

    const inVal = correctionType === 'Punch Out Only' ? '-' : (requestedPunchIn || '09:30');
    const outVal = correctionType === 'Punch In Only' ? '-' : (requestedPunchOut || '18:30');

    if (correctionType === 'Punch In Only' && !requestedPunchIn) {
      alert('Please enter actual Punch In time.');
      return;
    }
    if (correctionType === 'Punch Out Only' && !requestedPunchOut) {
      alert('Please enter actual Punch Out time.');
      return;
    }

    const newReq: TimeCorrectionRequest = {
      id: `tc-${Date.now()}`,
      employeeId: employee.employeeId,
      employeeName: employee.fullName,
      departmentName: employee.departmentName,
      date,
      requestedPunchIn: inVal,
      requestedPunchOut: outVal,
      reason: `[${correctionType}] ${reason}`,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    dbService.addTimeCorrection(newReq);
    setShowModal(false);
    setDate('');
    setReason('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-md border border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Attendance Time Correction</h1>
          <p className="text-xs text-slate-500 mt-1">Request manual punch correction for Punch In or Punch Out attendance errors</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0f4c81] hover:bg-[#0055a5] text-white text-xs font-bold rounded-xl shadow-md transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Request Time Correction
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
        <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#0055a5]" /> Time Correction Audit Trail
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                <th className="p-3">Submitted On</th>
                <th className="p-3">Target Date</th>
                <th className="p-3">Requested Punch In</th>
                <th className="p-3">Requested Punch Out</th>
                <th className="p-3">Reason</th>
                <th className="p-3">HR Status & Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {corrections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">
                    No time correction requests filed.
                  </td>
                </tr>
              ) : (
                corrections.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-slate-900">{c.date}</td>
                    <td className="p-3 text-emerald-700 font-bold">{c.requestedPunchIn || '-'}</td>
                    <td className="p-3 text-blue-700 font-bold">{c.requestedPunchOut || '-'}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{c.reason}</td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <Badge status={c.status} />
                        {c.hrComment && <span className="text-[10px] text-slate-500 block italic">"{c.hrComment}"</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-1">Time Correction Request</h3>
            <p className="text-xs text-slate-500 mb-4">Select whether you are correcting Punch In or Punch Out</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correction Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Punch In Only', 'Punch Out Only', 'Both'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCorrectionType(type)}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition-all ${
                        correctionType === type
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Attendance</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(correctionType === 'Punch In Only' || correctionType === 'Both') && (
                  <div className={correctionType === 'Punch In Only' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Actual Punch In Time</label>
                    <input
                      type="time"
                      required
                      value={requestedPunchIn}
                      onChange={(e) => setRequestedPunchIn(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
                    />
                  </div>
                )}
                {(correctionType === 'Punch Out Only' || correctionType === 'Both') && (
                  <div className={correctionType === 'Punch Out Only' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Actual Punch Out Time</label>
                    <input
                      type="time"
                      required
                      value={requestedPunchOut}
                      onChange={(e) => setRequestedPunchOut(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Missed Punch</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. GPS network machine error or emergency duty..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0055a5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f4c81] hover:bg-[#0055a5] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
