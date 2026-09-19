import React, { useState, useEffect } from 'react';
import { ShieldAlert, Download } from 'lucide-react';
import { AuditLog } from '../../types';
import { dbService } from '../../services/dbService';
import { exportAuditLogsToExcel } from '../../services/exportService';

export const AuditLogsTable: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    setLogs(dbService.getAuditLogs());
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" /> Immutable Security Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">Track authentication, attendance overrides, salary updates, and system configuration events</p>
        </div>

        <button
          onClick={() => exportAuditLogsToExcel(logs)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors self-start md:self-auto"
        >
          <Download className="w-4 h-4" /> Export Audit Log
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                <th className="p-3">Timestamp</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Module</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-500 font-mono">{l.timestamp}</td>
                  <td className="p-3">
                    <span className="font-extrabold text-slate-900 block">{l.userName}</span>
                    <span className="text-[10px] text-[#0055a5] block">{l.userRole}</span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">{l.action}</td>
                  <td className="p-3 text-slate-600">{l.module}</td>
                  <td className="p-3 font-mono text-slate-500">{l.ipAddress}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
