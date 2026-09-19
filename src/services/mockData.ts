import {
  User,
  Employee,
  Shift,
  AttendanceRecord,
  OfficeLocation,
  TimeCorrectionRequest,
  LeaveRequest,
  Holiday,
  Payslip,
  PayrollRun,
  Announcement,
  AuditLog,
  CompanySettings
} from '../types';

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'OM Shipping Ltd.',
  tagline: 'HRMS By Priva',
  logoUrl: '/assets/om_logo.jpg',
  address: 'OM Shipping Tower, Nariman Point, Marine Drive, Mumbai, Maharashtra 400021',
  phone: '+91 22 6789 4321',
  email: 'hr@omshipping.com',
  website: 'https://www.omshipping.com',
  workingDaysPerMonth: 26,
  currencySymbol: '₹',
  requireLocationForPunch: true,
  gracePeriodMinutes: 15,
  lateMarkAfterMinutes: 30,
  auditLoggingEnabled: true
};

export const INITIAL_PRIMARY_OFFICE: OfficeLocation = {
  id: 'off-1',
  name: 'OM Shipping Main Office',
  latitude: 18.9438,
  longitude: 72.8360,
  address: 'OM Shipping Tower, Nariman Point, Mumbai, Maharashtra 400021',
  isPrimary: true
};

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: 'sh-1',
    name: 'Shift A (12:30:00 to 20:00:00)',
    startTime: '12:30',
    endTime: '20:00',
    gracePeriodMins: 15,
    breakDurationMins: 45,
    workingHours: 7.5,
    weeklyOff: ['Sunday'],
    isOvernight: false
  },
  {
    id: 'sh-2',
    name: 'General Corporate Shift (09:30 to 18:30)',
    startTime: '09:30',
    endTime: '18:30',
    gracePeriodMins: 15,
    breakDurationMins: 60,
    workingHours: 8.0,
    weeklyOff: ['Sunday'],
    isOvernight: false
  },
  {
    id: 'sh-3',
    name: 'Night Port Shift (20:00 to 05:30)',
    startTime: '20:00',
    endTime: '05:30',
    gracePeriodMins: 20,
    breakDurationMins: 45,
    workingHours: 8.75,
    weeklyOff: ['Sunday'],
    isOvernight: true
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-hr-admin',
    email: 'hr@omshipping.com',
    name: 'HR Administrator',
    role: 'HR Administrator',
    employeeId: 'NVD0001',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    status: 'Active',
    createdAt: '2026-01-01'
  },
  {
    id: 'usr-emp-1001',
    email: 'john.doe@omshipping.com',
    name: 'Mr. John Fitzgerald Doe',
    role: 'Employee',
    employeeId: 'OM0001',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    status: 'Active',
    createdAt: '2026-01-10'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1001',
    title: 'Mr.',
    firstName: 'John',
    middleName: 'Fitzgerald',
    lastName: 'Doe',
    fullName: 'Mr. John Fitzgerald Doe',
    motherFullName: 'Mary Fitzgerald Doe',
    fatherFullName: 'Robert Edward Doe',
    nationality: 'Indian',
    employeeId: 'OM0001',
    biometricPin: '1024',
    email: 'john.doe@omshipping.com',
    portalPassword: 'OM0001',
    mobile: '+91 9876543210',
    alternateMobile: '+91 9876543211',
    gender: 'Male',
    dob: '1992-08-15',
    bloodGroup: 'O+',
    maritalStatus: 'Single',
    joiningDate: '2026-01-10',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    address: 'Flat 402, Sea Crest Towers, Marine Drive, Nariman Point, Mumbai 400021',
    status: 'Active',
    departmentName: 'Fleet Operations',
    designationName: 'Senior Logistics Engineer',
    shiftId: 'sh-1',
    shiftName: 'Shift A (12:30:00 to 20:00:00)',
    baseSalary: 65000,
    bankName: 'HDFC Bank',
    accountNumber: '50100982341920',
    ifscCode: 'HDFC0000240',
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '1234-5678-9012'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-2026-09-19-1001',
    employeeId: 'OM0001',
    employeeName: 'Mr. John Fitzgerald Doe',
    biometricPin: '1024',
    departmentName: 'Fleet Operations',
    date: '2026-09-19',
    punchIn: {
      latitude: 18.9439,
      longitude: 72.8361,
      accuracy: 10,
      timestamp: Date.now() - 28800000,
      address: 'OM Shipping Tower, Nariman Point, Marine Drive, Mumbai',
      deviceInfo: 'Browser GPS Sensor'
    },
    punchOut: {
      latitude: 18.9441,
      longitude: 72.8359,
      accuracy: 12,
      timestamp: Date.now() - 3600000,
      address: 'OM Shipping Tower, Nariman Point, Marine Drive, Mumbai',
      deviceInfo: 'Browser GPS Sensor'
    },
    workingHours: 7.5,
    status: 'Present',
    isLate: false,
    isEarlyExit: false,
    remarks: 'Verified GPS Punch'
  }
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lv-101',
    employeeId: 'OM0001',
    employeeName: 'Mr. John Fitzgerald Doe',
    departmentName: 'Fleet Operations',
    leaveType: 'Casual Leave',
    fromDate: '2026-09-24',
    toDate: '2026-09-25',
    totalDays: 2,
    reason: 'Family event',
    status: 'Pending',
    createdAt: '2026-09-18T10:30:00Z'
  }
];

export const INITIAL_TIME_CORRECTIONS: TimeCorrectionRequest[] = [];

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'hol-1', name: 'Gandhi Jayanti', date: '2026-10-02', dayOfWeek: 'Friday', type: 'National', description: 'National Holiday' },
  { id: 'hol-2', name: 'Dussehra / Vijayadashami', date: '2026-10-20', dayOfWeek: 'Tuesday', type: 'Company Festival', description: 'Festival celebration' },
  { id: 'hol-3', name: 'Diwali Deepavali', date: '2026-11-08', dayOfWeek: 'Sunday', type: 'Company Festival', description: 'Festival of Lights' }
];

export const INITIAL_PAYSLIPS: Payslip[] = [];
export const INITIAL_PAYROLL_RUNS: PayrollRun[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc-1',
    title: 'Welcome to OM Shipping Ltd. HRMS',
    description: 'Use the real-time GPS location feature to mark shift attendance from any location.',
    priority: 'High',
    targetAudience: 'All Employees',
    publishedBy: 'HR Administrator',
    publishedAt: '2026-09-19T09:00:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    userName: 'HR Administrator',
    userRole: 'HR Administrator',
    action: 'System Initialization',
    module: 'Authentication',
    ipAddress: '115.240.90.12',
    timestamp: '2026-09-19 09:00:00',
    details: 'OM Shipping Ltd. HRMS system initialized'
  }
];
