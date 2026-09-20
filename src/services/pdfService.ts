import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Payslip, CompanySettings } from '../types';

export async function generatePayslipPDF(payslip: Payslip, company: CompanySettings): Promise<void> {
  // Create an off-screen HTML element formatted as a formal corporate payslip
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '36px';
  container.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.color = '#0f172a';

  const logoSrc = company.logoUrl || '/assets/om_logo.jpg';
  const currency = company.currencySymbol || '₹';

  container.innerHTML = `
    <div style="border: 2px solid #1e3a8a; padding: 24px; border-radius: 12px; background: #ffffff;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <img src="${logoSrc}" style="height: 52px; width: auto; object-fit: contain; border-radius: 6px;" alt="Company Logo" />
          <div>
            <h1 style="font-size: 20px; font-weight: 900; color: #1e3a8a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">${company.companyName}</h1>
            <p style="font-size: 11px; color: #475569; margin: 2px 0 0 0;">${company.address}</p>
            <p style="font-size: 10px; color: #64748b; margin: 0;">Phone: ${company.phone} | Email: ${company.email}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="background-color: #1e3a8a; color: #ffffff; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 6px; display: inline-block; letter-spacing: 0.5px;">SALARY SLIP</span>
          <p style="font-size: 12px; font-weight: 800; color: #1e293b; margin: 8px 0 0 0;">Period: ${payslip.payPeriod}</p>
          <p style="font-size: 10px; font-family: monospace; color: #64748b; margin: 2px 0 0 0;">Ref: ${payslip.payslipNumber}</p>
        </div>
      </div>

      <!-- Employee Information Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
        <tr style="background-color: #f8fafc;">
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569; width: 20%;">Employee Name:</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 800; color: #0f172a; width: 30%;">${payslip.employeeName}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569; width: 20%;">Employee Code:</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 800; color: #1e3a8a; width: 30%; font-family: monospace;">${payslip.employeeId}</td>
        </tr>
        <tr>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">Department:</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 600;">${payslip.departmentName}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">Designation:</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 600;">${payslip.designationName}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">Staff Category:</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: ${payslip.staffCategory === 'Field Staff' ? '#047857' : '#1d4ed8'};">${payslip.staffCategory || 'Office Staff'}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">Date of Joining:</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1;">${payslip.joiningDate}</td>
        </tr>
        <tr>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">Bank Name:</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1;">${payslip.bankName || 'HDFC Bank Ltd.'}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">Bank Account No:</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${payslip.accountNumber || '50100982341920'}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">PAN Number:</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${payslip.panNumber || 'ABCDE1234F'}</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">PF No. / UAN:</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1;">${payslip.pfNumber || 'MH/BAN/0048291'} / ${payslip.uanNumber || '100928374619'}</td>
        </tr>
        <tr>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">Paid Days:</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">${payslip.paidDays} Days</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">LOP / Unpaid Days:</td>
          <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #dc2626;">${payslip.lopDays} Days</td>
        </tr>
      </table>

      <!-- Earnings & Deductions Components Breakdown -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
        <thead>
          <tr style="background-color: #1e3a8a; color: #ffffff;">
            <th style="padding: 9px 12px; text-align: left; width: 35%;">EARNINGS / ALLOWANCES</th>
            <th style="padding: 9px 12px; text-align: right; width: 15%;">AMOUNT (${currency})</th>
            <th style="padding: 9px 12px; text-align: left; width: 35%;">DEDUCTIONS / TAX</th>
            <th style="padding: 9px 12px; text-align: right; width: 15%;">AMOUNT (${currency})</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: 600;">Basic Salary</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700;">${(payslip.basicSalary || 0).toLocaleString('en-IN')}</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: 600;">Provident Fund (PF)</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700;">${(payslip.pfDeduction || 0).toLocaleString('en-IN')}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: 600;">House Rent Allowance (HRA)</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700;">${(payslip.hra || 0).toLocaleString('en-IN')}</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: 600;">Professional Tax (PT)</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700;">${(payslip.ptDeduction || 0).toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: 600;">Conveyance Allowance</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700;">${(payslip.conveyance || 0).toLocaleString('en-IN')}</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: 600;">TDS (Income Tax)</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700; color: #dc2626;">${(payslip.tdsDeduction || 0).toLocaleString('en-IN')}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: 600;">Special Allowance</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700;">${(payslip.specialAllowance || 0).toLocaleString('en-IN')}</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: 600;">Employee State Insurance (ESI)</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700;">${(payslip.esiDeduction || 0).toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: 600;">Performance Bonus / Incentives</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700;">${(payslip.bonus || 0).toLocaleString('en-IN')}</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: 600;">Other Deductions</td>
            <td style="padding: 7px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: 700;">${(payslip.otherDeductions || 0).toLocaleString('en-IN')}</td>
          </tr>
          <tr style="background-color: #e2e8f0; font-weight: 800;">
            <td style="padding: 9px 12px; border: 1px solid #94a3b8; color: #0f172a;">TOTAL GROSS EARNINGS</td>
            <td style="padding: 9px 12px; border: 1px solid #94a3b8; text-align: right; color: #0f172a;">${currency}${(payslip.grossSalary || 0).toLocaleString('en-IN')}</td>
            <td style="padding: 9px 12px; border: 1px solid #94a3b8; color: #0f172a;">TOTAL DEDUCTIONS</td>
            <td style="padding: 9px 12px; border: 1px solid #94a3b8; text-align: right; color: #dc2626;">-${currency}${(payslip.totalDeductions || 0).toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <!-- Net Pay Highlight Banner -->
      <div style="background-color: #eff6ff; border: 2px solid #3b82f6; padding: 14px 18px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #1d4ed8; font-weight: 800;">NET TAKE-HOME SALARY</span>
          <p style="font-size: 12px; font-weight: 700; color: #1e293b; margin: 3px 0 0 0;">In Words: <strong>${payslip.netPayInWords}</strong></p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 22px; font-weight: 900; color: #1e3a8a;">${currency}${(payslip.netPay || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <!-- Footer & Authorization -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; font-size: 10px; color: #64748b;">
        <div>
          <p style="margin: 0; font-style: italic;">This document is an electronically authenticated salary slip and requires no physical signature.</p>
          <p style="margin: 3px 0 0 0;">Issued by: OM Shipping Ltd. • Priva HRMS Engine</p>
        </div>
        <div style="text-align: center; border-top: 1px dashed #94a3b8; padding-top: 6px; width: 180px;">
          <p style="font-weight: 800; color: #0f172a; margin: 0;">AUTHORIZED SIGNATORY</p>
          <p style="margin: 2px 0 0 0; color: #64748b;">Human Resources Dept</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`OM_SalarySlip_${payslip.employeeId}_${payslip.payPeriod.replace('-', '_')}.pdf`);
  } catch (err) {
    console.error('Error generating PDF payslip:', err);
    alert('Failed to generate PDF salary slip. Please try again.');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
