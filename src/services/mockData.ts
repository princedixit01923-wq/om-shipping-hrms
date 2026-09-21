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

export const DEPARTMENTS = [
  'Sales Department',
  'Finance Department',
  'Technical Department'
] as const;

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'OM Safety Services LLP',
  tagline: 'ONCE WITH US SAFE WITH US',
  logoUrl: '/assets/om_logo.jpg',
  address: '"Om Enclave" Plot No.179, Industrial Area, Ward 6, Bharat Nagar, Gandhidham - 370 201, KANDLA - GUJARAT, INDIA',
  phone: '+91 2836 237773, Mob: +91 99095 24849',
  email: 'technical@omship.in',
  website: 'www.omship.in',
  workingDaysPerMonth: 26,
  currencySymbol: '₹',
  requireLocationForPunch: true,
  gracePeriodMinutes: 60,
  lateMarkAfterMinutes: 120,
  auditLoggingEnabled: true
};

export const INITIAL_PRIMARY_OFFICE: OfficeLocation = {
  id: 'off-1',
  name: 'OM Safety Services Head Office',
  latitude: 23.0753,
  longitude: 70.1337,
  address: '"Om Enclave" Plot No.179, Industrial Area, Ward 6, Bharat Nagar, Gandhidham - 370 201, Kandla - Gujarat',
  isPrimary: true
};

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: 'sh-1',
    name: 'Shift A (10:00 AM to 07:00 PM)',
    startTime: '10:00',
    endTime: '19:00',
    gracePeriodMins: 60,
    breakDurationMins: 60,
    workingHours: 9.0,
    weeklyOff: ['Sunday'],
    isOvernight: false
  },
  {
    id: 'sh-tech-flex',
    name: 'Technical Department Shift (Flexible / Anytime Punch)',
    startTime: '00:00',
    endTime: '23:59',
    gracePeriodMins: 120,
    breakDurationMins: 60,
    workingHours: 8.0,
    weeklyOff: ['Sunday'],
    isOvernight: false
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
    email: 'rahul.kumar@omship.in',
    name: 'Mr. Rahul Kumar',
    role: 'Employee',
    employeeId: 'OSS/13/2026',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    status: 'Active',
    createdAt: '2026-07-01'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1001',
    title: 'Mr.',
    firstName: 'Rahul',
    middleName: '',
    lastName: 'Kumar',
    fullName: 'Rahul Kumar',
    motherFullName: '',
    fatherFullName: '',
    nationality: 'Indian',
    employeeId: 'OSS/13/2026',
    biometricPin: '1024',
    email: 'rahul.kumar@omship.in',
    portalPassword: 'OM0001',
    mobile: '+91 9909524849',
    alternateMobile: '',
    gender: 'Male',
    dob: '1995-05-15',
    bloodGroup: 'B+',
    maritalStatus: 'Single',
    joiningDate: '2026-07-01',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    address: 'Plot No. 179, Ward 6, Bharat Nagar, Gandhidham, Gujarat',
    status: 'Active',
    departmentName: 'Technical Department',
    designationName: 'Technician',
    staffCategory: 'Field Staff',
    workLocation: 'FIELD WORK',
    shiftId: 'sh-tech-flex',
    shiftName: 'Technical Department Shift (Flexible / Anytime Punch)',
    baseSalary: 22000,
    hra: 0,
    conveyance: 0,
    specialAllowance: 0,
    otherAllowance: 0,
    pfDeduction: 0,
    esiDeduction: 0,
    tdsDeduction: 0,
    advanceDeduction: 0,
    otherDeduction: 0,
    bankName: 'State Bank of India',
    accountNumber: '38901248912',
    ifscCode: 'SBIN0001234',
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '1234-5678-9012'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-2026-09-21-1001',
    employeeId: 'OSS/13/2026',
    employeeName: 'Rahul Kumar',
    biometricPin: '1024',
    departmentName: 'Technical Department',
    staffCategory: 'Field Staff',
    date: '2026-09-21',
    punchIn: {
      latitude: 23.0753,
      longitude: 70.1337,
      accuracy: 10,
      timestamp: Date.now() - 28800000,
      address: 'Industrial Area, Ward 6, Bharat Nagar, Gandhidham, Gujarat',
      deviceInfo: 'Mobile Device GPS'
    },
    punchOut: {
      latitude: 23.0755,
      longitude: 70.1339,
      accuracy: 12,
      timestamp: Date.now() - 3600000,
      address: 'Kandla Port Terminal, Gujarat',
      deviceInfo: 'Mobile Device GPS'
    },
    workingHours: 7.0,
    status: 'Present',
    isLate: false,
    isEarlyExit: false,
    remarks: 'Verified GPS Punch'
  }
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lv-101',
    employeeId: 'OSS/13/2026',
    employeeName: 'Rahul Kumar',
    departmentName: 'Technical Department',
    leaveType: 'Casual Leave',
    fromDate: '2026-09-25',
    toDate: '2026-09-26',
    totalDays: 2,
    reason: 'Personal work',
    status: 'Pending',
    createdAt: '2026-09-20T10:30:00Z'
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
    title: 'Welcome to OM Safety Services LLP HRMS',
    description: 'Use the live GPS location feature to mark shift attendance anytime.',
    priority: 'High',
    targetAudience: 'All Employees',
    publishedBy: 'HR Administrator',
    publishedAt: '2026-09-21T09:00:00Z'
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
    timestamp: '2026-09-21 09:00:00',
    details: 'OM Safety Services LLP HRMS system initialized'
  }
];
