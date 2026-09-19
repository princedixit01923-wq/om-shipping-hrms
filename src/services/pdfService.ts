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
  container.style.padding = '40px';
  container.style.fontFamily = "'Inter', 'Plus Jakarta Sans', Arial, sans-serif";
  container.style.color = '#1e293b';

  container.innerHTML = `
    <div style="border: 2px solid #0f4c81; padding: 24px; border-radius: 8px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <img src="${company.logoUrl}" style="height: 60px; object-fit: contain;" alt="Company Logo" />
          <div>
            <h1 style="font-size: 22px; font-weight: 800; color: #0f4c81; margin: 0; text-transform: uppercase;">${company.companyName}</h1>
            <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">${company.address}</p>
            <p style="font-size: 11px; color: #64748b; margin: 0;">Phone: ${company.phone} | Email: ${company.email}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="background-color: #0f4c81; color: #ffffff; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 4px; display: inline-block;">SALARY SLIP</span>
          <p style="font-size: 12px; font-weight: 700; color: #334155; margin: 8px 0 0 0;">Period: ${payslip.payPeriod}</p>
          <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Ref: ${payslip.payslipNumber}</p>
        </div>
      </div>

      <!-- Employee Info Grid -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569; width: 20%;">Employee Name:</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 600; color: #0f172a; width: 30%;">${payslip.employeeName}</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569; width: 20%;">Employee ID:</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 600; color: #0f172a; width: 30%;">${payslip.employeeId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">Department:</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${payslip.departmentName}</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">Designation:</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${payslip.designationName}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">Bank Name:</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${payslip.bankName}</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">Account No:</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${payslip.accountNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">PAN Number:</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${payslip.panNumber}</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">PF / UAN:</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${payslip.pfNumber || 'N/A'} / ${payslip.uanNumber || 'N/A'}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">Paid Days:</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${payslip.paidDays} Days</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569;">LOP Days:</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${payslip.lopDays} Days</td>
        </tr>
      </table>

      <!-- Earnings & Deductions Breakdown -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
        <thead>
          <tr style="background-color: #0f4c81; color: #ffffff;">
            <th style="padding: 10px 12px; text-align: left; width: 35%;">EARNINGS</th>
            <th style="padding: 10px 12px; text-align: right; width: 15%;">AMOUNT (${company.currencySymbol})</th>
            <th style="padding: 10px 12px; text-align: left; width: 35%;">DEDUCTIONS</th>
            <th style="padding: 10px 12px; text-align: right; width: 15%;">AMOUNT (${company.currencySymbol})</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Basic Salary</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">${payslip.basicSalary.toLocaleString('en-IN')}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Provident Fund (PF)</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">${payslip.pfDeduction.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">House Rent Allowance (HRA)</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">${payslip.hra.toLocaleString('en-IN')}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Employee State Insurance (ESI)</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">${payslip.esiDeduction.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Conveyance Allowance</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">${payslip.conveyance.toLocaleString('en-IN')}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Professional Tax (PT)</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">${payslip.ptDeduction.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Special Allowance</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">${payslip.specialAllowance.toLocaleString('en-IN')}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">TDS / Income Tax</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">${payslip.tdsDeduction.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Performance Bonus / Incentives</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">${payslip.bonus.toLocaleString('en-IN')}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Other Deductions / Advances</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">${payslip.otherDeductions.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="background-color: #e2e8f0; font-weight: 700;">
            <td style="padding: 10px 12px; border: 1px solid #94a3b8; color: #0f172a;">GROSS SALARY</td>
            <td style="padding: 10px 12px; border: 1px solid #94a3b8; text-align: right; color: #0f172a;">${company.currencySymbol}${payslip.grossSalary.toLocaleString('en-IN')}</td>
            <td style="padding: 10px 12px; border: 1px solid #94a3b8; color: #0f172a;">TOTAL DEDUCTIONS</td>
            <td style="padding: 10px 12px; border: 1px solid #94a3b8; text-align: right; color: #dc2626;">${company.currencySymbol}${payslip.totalDeductions.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <!-- Net Pay Banner -->
      <div style="background-color: #eff6ff; border: 2px solid #3b82f6; padding: 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #1d4ed8; font-weight: 700;">NET AMOUNT PAYABLE</span>
          <p style="font-size: 13px; font-weight: 600; color: #1e293b; margin: 4px 0 0 0;">In Words: <strong>${payslip.netPayInWords}</strong></p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 24px; font-weight: 900; color: #0f4c81;">${company.currencySymbol}${payslip.netPay.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <!-- Footer & Signatures -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; font-size: 11px; color: #64748b;">
        <div>
          <p style="margin: 0; font-style: italic;">This is a computer-generated payslip and does not require a physical signature.</p>
          <p style="margin: 4px 0 0 0;">Generated on: ${new Date(payslip.generatedAt).toLocaleDateString('en-IN')} | OM HRMS Engine</p>
        </div>
        <div style="text-align: center; border-top: 1px dashed #94a3b8; padding-top: 8px; width: 200px;">
          <p style="font-weight: 700; color: #0f172a; margin: 0;">AUTHORIZED SIGNATORY</p>
          <p style="margin: 2px 0 0 0;">OM Shipping Prince HR Dept</p>
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
    pdf.save(`Payslip_${payslip.employeeId}_${payslip.payPeriod.replace(' ', '_')}.pdf`);
  } catch (err) {
    console.error('Error generating PDF payslip:', err);
  } finally {
    document.body.removeChild(container);
  }
}
