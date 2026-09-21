export type UserRole = 'HR Administrator' | 'Employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId?: string;
  avatarUrl?: string;
  status: 'Active' | 'Disabled';
  createdAt: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMins: number;
  breakDurationMins: number;
  workingHours: number;
  weeklyOff: string[];
  isOvernight: boolean;
}

export interface Employee {
  id: string;
  title: 'Mr.' | 'Mrs.' | 'Ms.' | 'Dr.';
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  motherFullName?: string;
  fatherFullName?: string;
  nationality: string;
  
  employeeId: string; // Custom Employee ID / Code e.g. NVD0024
  biometricPin: string; // e.g. 1024
  email: string;
  portalPassword?: string; // Set by HR
  mobile: string;
  alternateMobile?: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  bloodGroup: string; // e.g., A+, O+, Unknown
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  spouseName?: string;
  joiningDate: string;
  profilePhoto: string;
  address: string;
  status: 'Active' | 'Inactive';

  // Free-text department & designation as requested
  departmentName: string;
  designationName: string;
  
  staffCategory?: 'Office Staff' | 'Field Staff'; // Office Staff (fixed shift) vs Field Staff (flexible time)
  workLocation?: string; // e.g. FIELD WORK, GANDHIDHAM OFFICE, etc.

  shiftId: string;
  shiftName: string;

  baseSalary: number;
  hra?: number;
  conveyance?: number;
  specialAllowance?: number;
  otherAllowance?: number;

  pfDeduction?: number;
  esiDeduction?: number;
  tdsDeduction?: number;
  advanceDeduction?: number;
  otherDeduction?: number;
  
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  aadhaarNumber?: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
  deviceInfo?: string;
}

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Half Day'
  | 'On Leave'
  | 'Holiday'
  | 'Weekly Off'
  | 'Late'
  | 'Early Exit';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  biometricPin: string;
  departmentName: string;
  staffCategory?: 'Office Staff' | 'Field Staff';
  date: string; // YYYY-MM-DD
  punchIn?: LocationCoordinates;
  punchOut?: LocationCoordinates;
  workingHours?: number;
  status: AttendanceStatus;
  isLate: boolean;
  isEarlyExit: boolean;
  remarks?: string;
}

export interface OfficeLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  isPrimary: boolean;
}

export interface TimeCorrectionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  date: string;
  currentPunchIn?: string;
  currentPunchOut?: string;
  requestedPunchIn: string;
  requestedPunchOut: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  hrComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Paid Leave' | 'Unpaid Leave' | 'Half Day';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  hrComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  dayOfWeek: string;
  type: 'National' | 'Regional' | 'Company Festival';
  description?: string;
}

export interface Payslip {
  id: string;
  payslipNumber: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  designationName: string;
  staffCategory?: 'Office Staff' | 'Field Staff';
  workLocation?: string;
  joiningDate: string;
  payPeriod: string;
  salaryMonth?: string;
  salaryYear?: string;

  totalCalendarDays?: number;
  totalWorkingDays?: number;
  presentDays?: number;
  absentDays?: number;
  companyHolidays?: number;
  paidLeaveDays?: number;
  weeklyOffs?: number;
  otDays?: number;

  paidDays: number;
  lopDays: number;
  
  basicSalary: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  otherAllowance?: number;
  bonus?: number;
  grossSalary: number;

  pfDeduction: number;
  esiDeduction: number;
  ptDeduction?: number;
  tdsDeduction: number;
  advanceDeduction?: number;
  otherDeduction?: number;
  otherDeductions?: number;
  totalDeductions: number;

  netPay: number;
  netPayInWords: string;
  status: 'Draft' | 'Finalized' | 'Paid';
  generatedAt: string;

  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  pfNumber?: string;
  uanNumber?: string;
}

export interface PayrollRun {
  id: string;
  monthYear: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  status: 'Draft' | 'Processing' | 'Finalized' | 'Paid';
  processedBy: string;
  processedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  targetAudience: 'All Employees' | 'Management';
  publishedBy: string;
  publishedAt: string;
}

export interface AuditLog {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  ipAddress: string;
  timestamp: string;
  details: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  workingDaysPerMonth: number;
  currencySymbol: string;
  
  requireLocationForPunch: boolean;
  gracePeriodMinutes: number;
  lateMarkAfterMinutes: number;
  auditLoggingEnabled: boolean;
}
