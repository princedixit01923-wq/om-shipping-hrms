import React, { useState, useEffect } from 'react';
import { DollarSign, Play, Download, CheckCircle, FileText, Printer } from 'lucide-react';
import { PayrollRun, Payslip, CompanySettings, Employee } from '../../types';
import { dbService } from '../../services/dbService';
import { generatePayslipPDF } from '../../services/pdfService';
import { exportPayrollToExcel } from '../../services/exportService';
import { Badge } from '../common/Badge';

interface PayrollProcessorProps {
  settings: CompanySettings;
}

export const PayrollProcessor: React.FC<PayrollProcessorProps> = ({ settings }) => {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedMonthYear, setSelectedMonthYear] = useState('2026-09');
  const [isProcessing, setIsProcessing] = useState(false);

  const reloadData = () => {
    setPayrollRuns(dbService.getPayrollRuns());
    setPayslips(dbService.getPayslips());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const handleRunPayroll = () => {
    setIsProcessing(true);
    setTimeout(() => {
      dbService.generateMonthlyPayroll(selectedMonthYear, 'Meera Sharma (HR Lead)');
      setIsProcessing(false);
      alert(`Payroll successfully generated and finalized for ${selectedMonthYear}!`);
    }, 1200);
  };

  const handleDownloadSinglePDF = async (p: Payslip) => {
    await generatePayslipPDF(p, settings);
  };

  const handleExportPayrollExcel = () => {
    exportPayrollToExcel(payslips, `OM_Payroll_${selectedMonthYear}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Processing Control Bar */}
      <div className="card-3d bg-white p-6 rounded-3xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" /> Monthly Payroll & PDF Payslip Processing
          </h1>
          <p className="text-xs text-slate-500 mt-1">Batch process monthly salaries, earnings breakdown, statutory tax deductions & PDF generation</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonthYear}
            onChange={(e) => setSelectedMonthYear(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all"
          />

          <button
            onClick={handleRunPayroll}
            disabled={isProcessing}
            className="btn-3d-emerald flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl"
          >
            <Play className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Processing Payroll...' : 'Execute Payroll Batch'}</span>
          </button>
        </div>
      </div>

      {/* Payroll History Summary Runs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {payrollRuns.map((r) => (
          <div key={r.id} className="card-3d bg-white p-6 rounded-3xl border border-slate-200/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-black text-sm text-blue-600">{r.monthYear} Run</span>
              <Badge status={r.status} />
            </div>

            <div className="py-3 space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Total Employees:</span>
                <span className="font-extrabold text-slate-900">{r.totalEmployees} Staff</span>
              </div>
              <div className="flex justify-between">
                <span>Gross Payroll:</span>
                <span className="font-extrabold text-slate-900">{settings.currencySymbol}{r.totalGrossPay.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Deductions:</span>
                <span className="font-extrabold text-rose-600">-{settings.currencySymbol}{r.totalDeductions.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2.5 border-t border-slate-100">
                <span className="font-black text-slate-800">Net Disbursement:</span>
                <span className="font-black text-emerald-600 text-sm">{settings.currencySymbol}{r.totalNetPay.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payslip Records & Download Grid */}
      <div className="card-3d bg-white rounded-3xl p-6 border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0055a5]" /> Finalized Employee Payslips ({payslips.length})
          </h3>

          <button
            onClick={handleExportPayrollExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Summary Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                <th className="p-3">Payslip Number</th>
                <th className="p-3">Staff Member</th>
                <th className="p-3">Department</th>
                <th className="p-3">Gross Salary</th>
                <th className="p-3">Deductions</th>
                <th className="p-3">Net Pay</th>
                <th className="p-3 text-right">PDF Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {payslips.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-700">{p.payslipNumber}</td>
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{p.employeeName}</span>
                    <span className="text-[10px] text-slate-500 block">{p.employeeId}</span>
                  </td>
                  <td className="p-3 text-slate-600">{p.departmentName}</td>
                  <td className="p-3">{settings.currencySymbol}{p.grossSalary.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-rose-600">-{settings.currencySymbol}{p.totalDeductions.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-extrabold text-[#0f4c81]">{settings.currencySymbol}{p.netPay.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDownloadSinglePDF(p)}
                      className="px-3 py-1 bg-blue-50 hover:bg-[#0055a5] text-[#0f4c81] hover:text-white font-extrabold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF Slip
                    </button>
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
