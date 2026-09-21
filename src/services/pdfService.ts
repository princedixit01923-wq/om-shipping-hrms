import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Payslip, CompanySettings } from '../types';

export async function generatePayslipPDF(payslip: Payslip, company: CompanySettings): Promise<void> {
  // Create an off-screen HTML element formatted exactly as the OM Safety Services LLP Salary Slip
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '850px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '24px 30px';
  container.style.fontFamily = "'Arial', 'Helvetica', sans-serif";
  container.style.color = '#000000';
  container.style.boxSizing = 'border-box';

  const formatCurrency = (val: number | undefined) => {
    const num = Number(val) || 0;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const month = payslip.salaryMonth || 'AUGUST';
  const year = payslip.salaryYear || '2026';
  const workLoc = payslip.workLocation || 'FIELD WORK';
  const dojFormatted = payslip.joiningDate
    ? payslip.joiningDate.split('-').reverse().join('.')
    : '01.07.2026';

  container.innerHTML = `
    <div style="background: #ffffff; width: 100%; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px;">
      <!-- Top Letterhead -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <!-- OM Graphic Logo -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="font-size: 42px; font-weight: 900; color: #0055a5; line-height: 1; letter-spacing: -2px;">OM</div>
            <div>
              <div style="font-size: 26px; font-weight: 900; color: #003366; line-height: 1; letter-spacing: 0.5px;">SAFETY SERVICES LLP</div>
              <div style="font-size: 11px; font-weight: bold; font-style: italic; color: #0055a5; letter-spacing: 1px; margin-top: 2px;">ONCE WITH US SAFE WITH US</div>
            </div>
          </div>
        </div>

        <!-- Certification Badges -->
        <div style="display: flex; align-items: center; gap: 10px; text-align: center;">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <!-- Circular ISO Stamp Badge Simulation -->
            <div style="border: 1.5px solid #003366; border-radius: 50%; width: 50px; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 7px; font-weight: bold; color: #003366; line-height: 1.1;">
              <span>ABS Quality</span>
              <span>Evaluations</span>
              <span style="font-size: 6px;">ISO 9001</span>
            </div>
          </div>
          <div style="border-left: 1px solid #cbd5e1; padding-left: 10px; text-align: right;">
            <div style="font-size: 11px; font-weight: 900; color: #003366; letter-spacing: 0.5px;">ANAB</div>
            <div style="font-size: 8px; color: #64748b;">ACCREDITED</div>
            <div style="font-size: 9px; font-weight: bold; color: #003366; margin-top: 3px;">An ISO 9001:2015 Company</div>
            <div style="font-size: 9px; font-weight: bold; color: #003366;">Certified by ABS QE</div>
          </div>
        </div>
      </div>

      <!-- Subtitle Tagline -->
      <div style="text-align: center; margin-top: 4px; padding: 4px 0; border-top: 1.5px solid #003366; border-bottom: 1.5px solid #003366;">
        <div style="font-size: 12px; font-weight: 900; color: #003366; letter-spacing: 0.5px;">
          SAFETY SERVICES, SUPPLIES, REPAIRS & CONSULTANTS
        </div>
        <div style="font-size: 9px; font-weight: bold; color: #0055a5; letter-spacing: 0.5px; margin-top: 1px;">
          LSA/FFA / LIFEBOAT / LIFERAFT / CALIBRATION / CARGO GEAR SERVICING COMPANY
        </div>
      </div>

      <!-- Salary Slip Title -->
      <div style="text-align: center; margin: 12px 0 10px 0;">
        <span style="font-size: 14px; font-weight: 900; text-decoration: underline; letter-spacing: 1px; color: #000000;">SALARY SLIP</span>
      </div>

      <!-- Salary Month & Year Selector Boxes -->
      <div style="display: flex; justify-content: flex-start; gap: 12px; margin-bottom: 12px;">
        <div style="display: flex; border: 1px solid #003366; border-radius: 2px;">
          <div style="background-color: #f1f5f9; padding: 4px 10px; font-size: 10px; font-weight: bold; color: #000000; border-right: 1px solid #003366;">
            SALARY MONTH
          </div>
          <div style="padding: 4px 18px; font-size: 10px; font-weight: bold; color: #000000;">
            ${month}
          </div>
        </div>

        <div style="display: flex; border: 1px solid #003366; border-radius: 2px;">
          <div style="background-color: #f1f5f9; padding: 4px 10px; font-size: 10px; font-weight: bold; color: #000000; border-right: 1px solid #003366;">
            YEAR
          </div>
          <div style="padding: 4px 18px; font-size: 10px; font-weight: bold; color: #000000;">
            ${year}
          </div>
        </div>
      </div>

      <!-- Box 1: Employee Details Table -->
      <div style="margin-bottom: 12px;">
        <div style="background-color: #003366; color: #ffffff; padding: 4px 8px; font-size: 10px; font-weight: 900; letter-spacing: 0.5px;">
          EMPLOYEE DETAILS
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <tr>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold; width: 22%; background-color: #ffffff;">EMPLOYEE NAME</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; width: 28%;">${payslip.employeeName.toUpperCase()}</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold; width: 22%; background-color: #ffffff;">EMPLOYEE ID</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; width: 28%; font-weight: bold;">${payslip.employeeId}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold; background-color: #ffffff;">DESIGNATION</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px;">${payslip.designationName.toUpperCase()}</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold; background-color: #ffffff;">DEPARTMENT</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px;">${payslip.departmentName.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold; background-color: #ffffff;">DATE OF JOINING</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px;">${dojFormatted}</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold; background-color: #ffffff;">WORK LOCATION</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px;">${workLoc.toUpperCase()}</td>
          </tr>
        </table>
      </div>

      <!-- Box 2: Attendance Summary Table -->
      <div style="margin-bottom: 12px;">
        <div style="background-color: #003366; color: #ffffff; padding: 4px 8px; font-size: 10px; font-weight: 900; letter-spacing: 0.5px;">
          ATTENDANCE SUMMARY
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <tr>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold; width: 25%;">TOTAL CALENDAR DAYS</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; width: 25%;">${payslip.totalCalendarDays || 31}</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold; width: 25%;">TOTAL WORKING DAYS</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; width: 25%;">${payslip.totalWorkingDays || 26}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">PRESENT DAYS</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px;">${payslip.presentDays !== undefined ? payslip.presentDays : 26}</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">ABSENT DAYS</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px;">${payslip.absentDays || 0}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">COMPANY HOLIDAYS</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px;">${payslip.companyHolidays || 0}</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">PAID LEAVE</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px;">${payslip.paidLeaveDays || 0}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">WEEKLY OFFS</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px;">${payslip.weeklyOffs !== undefined ? payslip.weeklyOffs : 1}</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">OT DAYS</td>
            <td style="border: 1px solid #94a3b8; padding: 4px 8px;">${payslip.otDays !== undefined ? payslip.otDays : 4}</td>
          </tr>
        </table>
      </div>

      <!-- Box 3: Side-by-Side Earnings & Deductions Table with Yellow Amount Columns -->
      <div style="margin-bottom: 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr>
              <th colspan="2" style="background-color: #003366; color: #ffffff; padding: 4px 8px; font-size: 10px; font-weight: 900; text-align: center; border: 1px solid #003366; width: 50%;">
                EARNINGS
              </th>
              <th colspan="2" style="background-color: #003366; color: #ffffff; padding: 4px 8px; font-size: 10px; font-weight: 900; text-align: center; border: 1px solid #003366; width: 50%;">
                DEDUCTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold; width: 32%;">BASIC SALARY</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; text-align: right; width: 18%; background-color: #fff9e6; font-weight: bold;">${formatCurrency(payslip.basicSalary)}</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold; width: 32%;">PF / EPF</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; text-align: right; width: 18%; background-color: #fff9e6; font-weight: bold;">${formatCurrency(payslip.pfDeduction)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">HOUSE RENT ALLOWANCE</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; text-align: right; background-color: #fff9e6; font-weight: bold;">${formatCurrency(payslip.hra)}</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">ESI</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; text-align: right; background-color: #fff9e6; font-weight: bold;">${formatCurrency(payslip.esiDeduction)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">CONVEYANCE ALLOWANCE</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; text-align: right; background-color: #fff9e6; font-weight: bold;">${formatCurrency(payslip.conveyance)}</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">TDS</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; text-align: right; background-color: #fff9e6; font-weight: bold;">${formatCurrency(payslip.tdsDeduction)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">SPECIAL ALLOWANCE</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; text-align: right; background-color: #fff9e6; font-weight: bold;">${formatCurrency(payslip.specialAllowance)}</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">SALARY ADVANCE/OTHER</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; text-align: right; background-color: #fff9e6; font-weight: bold;">${formatCurrency(payslip.advanceDeduction)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">OTHER ALLOWANCE</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; text-align: right; background-color: #fff9e6; font-weight: bold;">${formatCurrency(payslip.otherAllowance)}</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; font-weight: bold;">OTHER DEDUCTION</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; text-align: right; background-color: #fff9e6; font-weight: bold;">${formatCurrency(payslip.otherDeduction)}</td>
            </tr>
            <tr style="font-weight: 900;">
              <td style="border: 1px solid #94a3b8; padding: 4px 8px;">GROSS SALARY</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; text-align: right; background-color: #cbd5e1;">${formatCurrency(payslip.grossSalary)}</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px;">TOTAL DEDUCTIONS</td>
              <td style="border: 1px solid #94a3b8; padding: 4px 8px; text-align: right; background-color: #cbd5e1;">${formatCurrency(payslip.totalDeductions)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Box 4: Net Salary Payable Highlight Row -->
      <div style="display: flex; margin-bottom: 8px; border: 1.5px solid #003366;">
        <div style="background-color: #003366; color: #ffffff; padding: 5px 12px; font-size: 11px; font-weight: 900; letter-spacing: 0.5px; width: 75%; text-align: center;">
          NET SALARY PAYABLE
        </div>
        <div style="padding: 5px 12px; font-size: 11px; font-weight: 900; color: #000000; width: 25%; text-align: right; background-color: #ffffff;">
          ${formatCurrency(payslip.netPay)}
        </div>
      </div>

      <!-- In Words Line -->
      <div style="font-size: 10px; font-weight: bold; margin-bottom: 24px;">
        (IN WORDS): <span style="font-style: italic;">${payslip.netPayInWords}</span>
      </div>

      <!-- Authorized Signatory Section with Circular Stamp -->
      <div style="display: flex; justify-content: flex-start; align-items: flex-start; margin-bottom: 28px;">
        <div>
          <div style="font-size: 10px; font-weight: 900; color: #000000; margin-bottom: 4px;">
            For OM SAFETY SERVICES LLP
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; width: 140px;">
            <!-- Circular Official Stamp Graphic -->
            <div style="border: 2px solid #003366; border-radius: 50%; width: 68px; height: 68px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #003366; font-size: 6.5px; font-weight: 900; text-align: center; line-height: 1.1; margin: 4px 0;">
              <span style="letter-spacing: 0.5px;">OM SAFETY</span>
              <span style="font-size: 8px; border-top: 1px solid #003366; border-bottom: 1px solid #003366; padding: 1px 4px; margin: 1px 0;">INDIA</span>
              <span style="letter-spacing: 0.5px;">SERVICES LLP</span>
            </div>
            <div style="font-size: 9px; font-weight: 900; color: #000000; margin-top: 4px;">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>

      <!-- Official Footer Details (Gandhidham Regd. Office & Port Branches) -->
      <div style="border-top: 1.5px solid #003366; padding-top: 6px; text-align: center; font-size: 8.5px; color: #003366; line-height: 1.4;">
        <div style="font-weight: 900;">
          Regd. Add. : "Om Enclave" Plot No.179, Industrial Area, Ward 6, Bharat Nagar, Gandhidham - 370 201, KANDLA - GUJARAT, INDIA.
        </div>
        <div style="font-weight: bold; margin-top: 1px;">
          Phone : +91 2836 237773, Mob. : +91 99095 24849, +91 85306 21739 | E-mail : technical@omship.in, info@omship.in, Web : www.omship.in
        </div>
        <div style="font-weight: 900; color: #002244; margin-top: 1px;">
          Branches : MUMBAI, VIZAG, CHENNAI, KOLKATA With SERVING AT ALL INDIAN PORTS
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`SalarySlip_${payslip.employeeId}_${month}_${year}.pdf`);
  } catch (error) {
    console.error('Error generating official payslip PDF:', error);
    alert('Failed to generate payslip PDF. Please try again.');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
