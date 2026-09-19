import React, { useState, useEffect } from 'react';
import { CreditCard, Download, FileCheck, DollarSign } from 'lucide-react';
import { Employee, Payslip, CompanySettings } from '../../types';
import { dbService } from '../../services/dbService';
import { generatePayslipPDF } from '../../services/pdfService';
import { Badge } from '../common/Badge';

interface MyPayslipsProps {
  employee: Employee;
  settings: CompanySettings;
}

export const MyPayslips: React.FC<MyPayslipsProps> = ({ employee, settings }) => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  useEffect(() => {
    const list = dbService.getPayslips().filter((p) => p.employeeId === employee.employeeId);
    setPayslips(list);
  }, [employee.employeeId]);

  const handleGenerateAndDownloadCurrent = async () => {
    const monthYear = new Date().toISOString().substring(0, 7); // e.g. 2026-09
    const basic = employee.baseSalary || 65000;
    const hra = Math.round(basic * 0.4);
    const conveyance = 3000;
    const specialAllowance = Math.round(basic * 0.25);
    const gross = basic + hra + conveyance + specialAllowance;

    const pfDeduction = Math.round(basic * 0.12);
    const ptDeduction = 200;
    const tdsDeduction = Math.round(basic * 0.08);
    const ded = pfDeduction + ptDeduction + tdsDeduction;
    const net = gross - ded;

    const instantPayslip: Payslip = {
      id: `pay-${monthYear}-${employee.employeeId}`,
      payslipNumber: `PAY-OM-${monthYear.replace('-', '')}-${employee.employeeId}`,
      employeeId: employee.employeeId,
      employeeName: employee.fullName,
      departmentName: employee.departmentName || 'Fleet Operations',
      designationName: employee.designationName || 'Senior Engineer',
      joiningDate: employee.joiningDate || '2026-01-01',
      payPeriod: monthYear,
      paidDays: 26,
      lopDays: 0,
      basicSalary: basic,
      hra,
      conveyance,
      specialAllowance,
      grossSalary: gross,
      pfDeduction,
      esiDeduction: 0,
      ptDeduction,
      tdsDeduction,
      totalDeductions: ded,
      netPay: net,
      netPayInWords: `${net.toLocaleString('en-IN')} Rupees Only`,
      status: 'Finalized',
      generatedAt: new Date().toISOString()
    };

    await generatePayslipPDF(instantPayslip, settings);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#1d4ed8]" /> Salary Slips & Monthly Earnings
          </h1>
          <p className="text-xs text-slate-500 mt-1">View monthly earnings, tax deductions, and download official PDF payslips</p>
        </div>

        <button
          onClick={handleGenerateAndDownloadCurrent}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1d4ed8] hover:bg-[#0a192f] text-white text-xs font-bold rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Download Salary Slip PDF
        </button>
      </div>

      {payslips.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-md space-y-4">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-[#1d4ed8]">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Generate Official Salary Slip</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Click the button below to generate and download your formatted PDF salary slip for the current pay period ({new Date().toISOString().substring(0, 7)}).
            </p>
          </div>
          <button
            onClick={handleGenerateAndDownloadCurrent}
            className="px-5 py-3 bg-[#1d4ed8] hover:bg-[#0a192f] text-white text-xs font-black rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Generate & Download Salary Slip PDF
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payslips.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/80 flex flex-col justify-between hover:shadow-lg transition-shadow">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-extrabold text-[#1d4ed8] uppercase tracking-wider">{p.payPeriod}</span>
                  <Badge status={p.status} />
                </div>

                <div className="py-4 space-y-2 text-xs font-semibold">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Earnings:</span>
                    <span className="font-bold text-slate-900">{settings.currencySymbol}{p.grossSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Deductions:</span>
                    <span className="font-bold text-rose-600">-{settings.currencySymbol}{p.totalDeductions.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                    <span className="font-extrabold text-slate-800">Net Take-Home Pay:</span>
                    <span className="text-lg font-black text-[#1d4ed8]">{settings.currencySymbol}{p.netPay.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDownloadPDF(p)}
                className="mt-4 w-full py-2.5 bg-blue-50 hover:bg-[#1d4ed8] text-[#1d4ed8] hover:text-white font-extrabold text-xs rounded-xl border border-blue-200 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Official PDF Slip
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
