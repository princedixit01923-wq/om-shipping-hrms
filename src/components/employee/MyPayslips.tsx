import React, { useState, useEffect } from 'react';
import { CreditCard, Download, FileCheck, DollarSign } from 'lucide-react';
import { Employee, Payslip, CompanySettings } from '../../types';
import { dbService } from '../../services/dbService';
import { generatePayslipPDF } from '../../services/pdfService';
import { convertNumberToWords } from '../../utils/numberToWords';
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

  const handleDownloadPDF = async (p: Payslip) => {
    await generatePayslipPDF(p, settings);
  };

  const handleGenerateAndDownloadCurrent = async () => {
    const now = new Date();
    const monthName = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const yearStr = String(now.getFullYear());
    const monthYear = `${yearStr}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const basic = Number(employee.baseSalary) || 22000;
    const hra = Number(employee.hra) || 0;
    const conveyance = Number(employee.conveyance) || 0;
    const specialAllowance = Number(employee.specialAllowance) || 0;
    const otherAllowance = Number(employee.otherAllowance) || 0;
    const gross = basic + hra + conveyance + specialAllowance + otherAllowance;

    const pfDeduction = Number(employee.pfDeduction) || 0;
    const esiDeduction = Number(employee.esiDeduction) || 0;
    const tdsDeduction = Number(employee.tdsDeduction) || 0;
    const advanceDeduction = Number(employee.advanceDeduction) || 0;
    const otherDeduction = Number(employee.otherDeduction) || 0;
    const ded = pfDeduction + esiDeduction + tdsDeduction + advanceDeduction + otherDeduction;
    const net = Math.max(0, gross - ded);

    const instantPayslip: Payslip = {
      id: `pay-${monthYear}-${employee.employeeId}`,
      payslipNumber: `OSS/${employee.employeeId.replace(/[^0-9]/g, '') || '13'}/${yearStr}`,
      employeeId: employee.employeeId,
      employeeName: employee.fullName,
      departmentName: employee.departmentName || 'Technical Department',
      designationName: employee.designationName || 'Technician',
      staffCategory: employee.staffCategory || 'Field Staff',
      workLocation: employee.workLocation || 'FIELD WORK',
      joiningDate: employee.joiningDate || '2026-07-01',
      payPeriod: monthYear,
      salaryMonth: monthName,
      salaryYear: yearStr,

      totalCalendarDays: 31,
      totalWorkingDays: 26,
      presentDays: 26,
      absentDays: 0,
      companyHolidays: 0,
      paidLeaveDays: 0,
      weeklyOffs: 1,
      otDays: 4,

      paidDays: 26,
      lopDays: 0,
      basicSalary: basic,
      hra,
      conveyance,
      specialAllowance,
      otherAllowance,
      grossSalary: gross,

      pfDeduction,
      esiDeduction,
      tdsDeduction,
      advanceDeduction,
      otherDeduction,
      totalDeductions: ded,

      netPay: net,
      netPayInWords: convertNumberToWords(net),
      status: 'Finalized',
      generatedAt: new Date().toISOString(),
      bankName: employee.bankName || 'State Bank of India',
      accountNumber: employee.accountNumber || '',
      ifscCode: employee.ifscCode || '',
      panNumber: employee.panNumber || ''
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
              Click the button below to generate and download your formatted PDF salary slip with all components (Basic, HRA, Allowances, TDS, PF, PT, Net Pay) for {new Date().toISOString().substring(0, 7)}.
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
                    <span>Total Deductions (TDS, PF, PT):</span>
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
