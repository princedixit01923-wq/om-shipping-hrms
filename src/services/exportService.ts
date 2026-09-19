import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AttendanceRecord, Employee, Payslip, AuditLog } from '../types';

export function exportAttendanceToExcel(records: AttendanceRecord[], fileName = 'Attendance_Report.xlsx') {
  const data = records.map((r) => ({
    Date: r.date,
    'Employee ID': r.employeeId,
    'Employee Name': r.employeeName,
    Department: r.departmentName,
    Status: r.status,
    'Punch In Time': r.punchIn ? new Date(r.punchIn.timestamp).toLocaleTimeString() : 'N/A',
    'Punch In Address': r.punchIn?.address || 'N/A',
    'Geofence Compliant': r.punchIn?.isWithinGeofence ? 'YES' : 'NO',
    'Punch Out Time': r.punchOut ? new Date(r.punchOut.timestamp).toLocaleTimeString() : 'N/A',
    'Working Hours': r.workingHours ? `${r.workingHours} hrs` : 'N/A',
    Remarks: r.remarks || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}

export function exportPayrollToExcel(payslips: Payslip[], fileName = 'Payroll_Summary.xlsx') {
  const data = payslips.map((p) => ({
    'Payslip No': p.payslipNumber,
    'Pay Period': p.payPeriod,
    'Employee ID': p.employeeId,
    'Employee Name': p.employeeName,
    Department: p.departmentName,
    Designation: p.designationName,
    'Bank Name': p.bankName,
    'Account No': p.accountNumber,
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}

export function exportEmployeesToCSV(employees: Employee[], fileName = 'Employee_Directory.csv') {
  const data = employees.map((e) => ({
    'Employee ID': e.employeeId,
    'Full Name': e.fullName,
    Email: e.email,
    Mobile: e.mobile,
    Department: e.departmentName,
    Designation: e.designationName,
    'Joining Date': e.joiningDate,
    Status: e.status,
    'Bank Name': e.bankDetails.bankName,
    'Account No': e.bankDetails.accountNumber,
    PAN: e.statutoryDetails.panNumber,
    Aadhaar: e.statutoryDetails.aadhaarNumber
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, fileName);
}

export function exportAuditLogsToExcel(logs: AuditLog[], fileName = 'Audit_Logs.xlsx') {
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

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}

export function downloadEmployeeImportTemplate() {
  const templateData = [
    {
      'Employee ID': 'OM-1099',
      'Full Name': 'Siddharth Varma',
      Email: 'siddharth.v@omshippingprince.com',
      Mobile: '+91 98111 22334',
      Gender: 'Male',
      DOB: '1992-05-15',
      'Joining Date': '2026-09-01',
      Department: 'Fleet Operations',
      Designation: 'Port Logistics Officer',
      'Employment Type': 'Full-Time',
      'Basic Salary': 50000,
      HRA: 20000,
      Conveyance: 3000,
      'Special Allowance': 12000,
      'Bank Name': 'HDFC Bank',
      'Account Number': '50100982341920',
      'IFSC Code': 'HDFC0000240',
      PAN: 'ABCDE1234F',
      Aadhaar: '1234-5678-9012'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'OM_HRMS_Employee_Import_Template.csv');
}
