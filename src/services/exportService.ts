import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AttendanceRecord, Employee, Payslip, AuditLog } from '../types';

/**
 * Robust cross-browser workbook saver that works seamlessly on desktop and smartphones
 */
function saveWorkbook(workbook: XLSX.WorkBook, fileName: string) {
  try {
    XLSX.writeFile(workbook, fileName);
  } catch (err) {
    console.warn('XLSX.writeFile fallback to Blob saveAs:', err);
    try {
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
    } catch (blobErr) {
      console.error('Failed to export workbook:', blobErr);
      alert('Unable to initiate automatic download on this browser.');
    }
  }
}

export function exportAttendanceToExcel(records: AttendanceRecord[], fileName = 'Attendance_Report.xlsx') {
  if (!records || records.length === 0) {
    alert('No attendance records found for the chosen criteria to export.');
    return;
  }

  const data = records.map((r) => {
    let punchInTime = 'N/A';
    if (r.punchIn?.timestamp) {
      try {
        punchInTime = new Date(r.punchIn.timestamp).toLocaleTimeString();
      } catch {
        punchInTime = 'N/A';
      }
    }

    let punchOutTime = 'N/A';
    if (r.punchOut?.timestamp) {
      try {
        punchOutTime = new Date(r.punchOut.timestamp).toLocaleTimeString();
      } catch {
        punchOutTime = 'N/A';
      }
    }

    return {
      Date: r.date,
      'Employee ID': r.employeeId,
      'Employee Name': r.employeeName,
      Department: r.departmentName,
      'Staff Category': r.staffCategory || 'Office Staff',
      Status: r.status,
      'Punch In Time': punchInTime,
      'Punch In GPS Location': r.punchIn?.address || 'N/A',
      'Punch Out Time': punchOutTime,
      'Punch Out GPS Location': r.punchOut?.address || 'N/A',
      'Working Hours': r.workingHours !== undefined ? `${r.workingHours} hrs` : 'N/A',
      'Is Late': r.isLate ? 'YES' : 'NO',
      'Is Early Exit': r.isEarlyExit ? 'YES' : 'NO',
      Remarks: r.remarks || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');

  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Date
    { wch: 14 }, // Employee ID
    { wch: 22 }, // Employee Name
    { wch: 22 }, // Department
    { wch: 16 }, // Staff Category
    { wch: 12 }, // Status
    { wch: 15 }, // Punch In Time
    { wch: 35 }, // Punch In Address
    { wch: 15 }, // Punch Out Time
    { wch: 35 }, // Punch Out Address
    { wch: 14 }, // Working Hours
    { wch: 10 }, // Is Late
    { wch: 12 }, // Is Early Exit
    { wch: 25 }  // Remarks
  ];

  saveWorkbook(workbook, fileName);
}

export function exportPayrollToExcel(payslips: Payslip[], fileName = 'Payroll_Summary.xlsx') {
  if (!payslips || payslips.length === 0) {
    alert('No payslips available to export.');
    return;
  }

  const data = payslips.map((p) => ({
    'Payslip No': p.payslipNumber,
    'Pay Period': p.payPeriod,
    'Employee ID': p.employeeId,
    'Employee Name': p.employeeName,
    Department: p.departmentName,
    Designation: p.designationName,
    'Staff Category': p.staffCategory || 'Office Staff',
    'Bank Name': p.bankName || 'N/A',
    'Account No': p.accountNumber || 'N/A',
    'IFSC Code': p.ifscCode || 'N/A',
    PAN: p.panNumber || 'N/A',
    'Paid Days': p.paidDays,
    'LOP Days': p.lopDays,
    'Basic Salary': p.basicSalary,
    HRA: p.hra,
    Conveyance: p.conveyance,
    'Special Allowance': p.specialAllowance,
    'Gross Salary': p.grossSalary,
    'PF Deduction': p.pfDeduction,
    'ESI Deduction': p.esiDeduction,
    'PT Deduction': p.ptDeduction,
    'TDS Deduction': p.tdsDeduction,
    'Total Deductions': p.totalDeductions,
    'Net Pay': p.netPay
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Summary');

  saveWorkbook(workbook, fileName);
}

export function exportEmployeesToCSV(employees: Employee[], fileName = 'Employee_Directory.csv') {
  if (!employees || employees.length === 0) {
    alert('No employee records available to export.');
    return;
  }

  const data = employees.map((e) => ({
    'Employee ID': e.employeeId,
    'Full Name': e.fullName,
    Email: e.email,
    Mobile: e.mobile,
    Department: e.departmentName,
    Designation: e.designationName,
    'Staff Category': e.staffCategory || 'Office Staff',
    'Shift Name': e.shiftName || 'General Shift',
    'Base Salary': e.baseSalary || 0,
    'Joining Date': e.joiningDate,
    Status: e.status,
    'Bank Name': e.bankName || 'N/A',
    'Account No': e.accountNumber || 'N/A',
    'IFSC Code': e.ifscCode || 'N/A',
    PAN: e.panNumber || 'N/A',
    Aadhaar: e.aadhaarNumber || 'N/A'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, fileName);
}

export function exportAuditLogsToExcel(logs: AuditLog[], fileName = 'Audit_Logs.xlsx') {
  if (!logs || logs.length === 0) {
    alert('No audit logs available to export.');
    return;
  }

  const data = logs.map((l) => ({
    ID: l.id,
    User: l.userName,
    Role: l.userRole,
    Action: l.action,
    Module: l.module,
    IP: l.ipAddress,
    Timestamp: l.timestamp,
    Details: l.details
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');

  saveWorkbook(workbook, fileName);
}

/**
 * Download standardized Employee Bulk Import Format (Excel .xlsx format)
 */
export function downloadEmployeeImportTemplate() {
  const sampleTemplate = [
    {
      'Employee ID': 'OM0015',
      'First Name': 'Vikram',
      'Last Name': 'Rathore',
      Email: 'vikram.r@omshippingprince.com',
      Mobile: '+91 98201 12345',
      Gender: 'Male',
      'Date of Birth': '1992-06-18',
      'Joining Date': '2026-09-01',
      Department: 'Fleet Operations',
      Designation: 'Port Logistics Officer',
      'Staff Category': 'Field Staff', // 'Office Staff' or 'Field Staff'
      'Shift Name': 'General Corporate Shift',
      'Base Salary': 55000,
      'Bank Name': 'HDFC Bank Ltd.',
      'Account Number': '50100982341920',
      'IFSC Code': 'HDFC0000240',
      'PAN Number': 'ABCDE1234F',
      'Aadhaar Number': '1234-5678-9012',
      Address: 'Om Shipping Port Office, Mumbai Port, Maharashtra'
    },
    {
      'Employee ID': 'OM0016',
      'First Name': 'Pooja',
      'Last Name': 'Nair',
      Email: 'pooja.n@omshippingprince.com',
      Mobile: '+91 98202 23456',
      Gender: 'Female',
      'Date of Birth': '1994-09-12',
      'Joining Date': '2026-09-15',
      Department: 'Maritime IT & Systems',
      Designation: 'System Administrator',
      'Staff Category': 'Office Staff',
      'Shift Name': 'General Corporate Shift',
      'Base Salary': 62000,
      'Bank Name': 'State Bank of India',
      'Account Number': '2019482710384',
      'IFSC Code': 'SBIN0000192',
      'PAN Number': 'BNMPK5678G',
      'Aadhaar Number': '9876-5432-1098',
      Address: 'OM Shipping Tower, Nariman Point, Mumbai'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleTemplate);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Import Template');

  worksheet['!cols'] = [
    { wch: 14 }, // Employee ID
    { wch: 14 }, // First Name
    { wch: 14 }, // Last Name
    { wch: 28 }, // Email
    { wch: 16 }, // Mobile
    { wch: 10 }, // Gender
    { wch: 14 }, // Date of Birth
    { wch: 14 }, // Joining Date
    { wch: 22 }, // Department
    { wch: 22 }, // Designation
    { wch: 18 }, // Staff Category
    { wch: 24 }, // Shift Name
    { wch: 14 }, // Base Salary
    { wch: 20 }, // Bank Name
    { wch: 18 }, // Account Number
    { wch: 14 }, // IFSC Code
    { wch: 14 }, // PAN Number
    { wch: 18 }, // Aadhaar Number
    { wch: 35 }  // Address
  ];

  saveWorkbook(workbook, 'OM_HRMS_Employee_Import_Template.xlsx');
}
