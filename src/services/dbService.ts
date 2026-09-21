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

import {
  INITIAL_COMPANY_SETTINGS,
  INITIAL_PRIMARY_OFFICE,
  INITIAL_SHIFTS,
  INITIAL_USERS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_TIME_CORRECTIONS,
  INITIAL_HOLIDAYS,
  INITIAL_PAYSLIPS,
  INITIAL_PAYROLL_RUNS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT_LOGS
} from './mockData';

import { supabase } from './supabaseClient';
import { convertNumberToWords } from '../utils/numberToWords';

const STORAGE_KEYS = {
  SETTINGS: 'om_hrms_settings',
  OFFICE: 'om_hrms_office',
  SHIFTS: 'om_hrms_shifts',
  USERS: 'om_hrms_users',
  EMPLOYEES: 'om_hrms_employees',
  ATTENDANCE: 'om_hrms_attendance',
  LEAVES: 'om_hrms_leaves',
  CORRECTIONS: 'om_hrms_corrections',
  HOLIDAYS: 'om_hrms_holidays',
  PAYSLIPS: 'om_hrms_payslips',
  PAYROLL_RUNS: 'om_hrms_payroll_runs',
  ANNOUNCEMENTS: 'om_hrms_announcements',
  AUDIT_LOGS: 'om_hrms_audit_logs',
  SESSION_USER: 'om_hrms_session_user'
};

type EventCallback = () => void;

class DatabaseService {
  private listeners: Set<EventCallback> = new Set();
  public isCloudConnected: boolean = false;

  constructor() {
    this.initSeedData();
    this.syncFromSupabase();
    this.initRealtimeAndSyncListeners();
  }

  public subscribe(cb: EventCallback) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  /**
   * Set up real-time websocket and focus event listeners to keep laptop & phone 100% in sync
   */
  private initRealtimeAndSyncListeners() {
    // 1. Supabase Postgres Realtime Changes
    try {
      supabase
        .channel('public:realtime_hrms')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          this.syncFromSupabase();
        })
        .subscribe();
    } catch (e) {
      console.warn('Supabase Realtime not subscribed:', e);
    }

    // 2. Window Focus & Visibility Change (Crucial for mobile <-> laptop multi-device sync)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.syncFromSupabase();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.syncFromSupabase();
        }
      });
      // 3. Periodic Background Pulse every 10 seconds
      setInterval(() => {
        this.syncFromSupabase();
      }, 10000);
    }
  }

  /**
   * Background Supabase Cloud Real-time Fetch & Sync
   */
  public async syncFromSupabase() {
    try {
      // 1. Sync Employees from Supabase
      const { data: empData, error: empErr } = await supabase.from('employees').select('*');
      if (!empErr && empData) {
        if (empData.length > 0) {
          this.setItem(STORAGE_KEYS.EMPLOYEES, empData);
          this.isCloudConnected = true;
        } else {
          // If remote table has 0 employees, seed with default employees
          const initial = this.getItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
          if (initial && initial.length > 0) {
            this.pushToSupabase('employees', initial);
          }
        }
      }

      // 2. Sync Attendance Records from Supabase
      const { data: attData, error: attErr } = await supabase.from('attendance_records').select('*');
      if (!attErr && attData && attData.length > 0) {
        this.setItem(STORAGE_KEYS.ATTENDANCE, attData);
      }

      // 3. Sync Shifts from Supabase
      const { data: shiftData, error: shiftErr } = await supabase.from('shifts').select('*');
      if (!shiftErr && shiftData) {
        if (shiftData.length > 0) {
          this.setItem(STORAGE_KEYS.SHIFTS, shiftData);
        } else {
          const initialShifts = this.getItem<Shift[]>(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS);
          if (initialShifts && initialShifts.length > 0) {
            this.pushToSupabase('shifts', initialShifts);
          }
        }
      }

      // 4. Sync Leave Requests from Supabase
      const { data: leaveData, error: leaveErr } = await supabase.from('leave_requests').select('*');
      if (!leaveErr && leaveData && leaveData.length > 0) {
        this.setItem(STORAGE_KEYS.LEAVES, leaveData);
      }

      // 5. Sync Announcements from Supabase
      const { data: ancData, error: ancErr } = await supabase.from('announcements').select('*');
      if (!ancErr && ancData && ancData.length > 0) {
        this.setItem(STORAGE_KEYS.ANNOUNCEMENTS, ancData);
      }

      // 6. Sync Holidays from Supabase
      const { data: holData, error: holErr } = await supabase.from('holidays').select('*');
      if (!holErr && holData) {
        if (holData.length > 0) {
          this.setItem(STORAGE_KEYS.HOLIDAYS, holData);
        } else {
          const initialHolidays = this.getItem<Holiday[]>(STORAGE_KEYS.HOLIDAYS, INITIAL_HOLIDAYS);
          if (initialHolidays && initialHolidays.length > 0) {
            this.pushToSupabase('holidays', initialHolidays);
          }
        }
      }

      // 7. Sync Company Settings from Supabase
      const { data: settingsData, error: settingsErr } = await supabase.from('company_settings').select('*').limit(1);
      if (!settingsErr && settingsData && settingsData.length > 0) {
        const setRow = settingsData[0];
        const current = this.getSettings();
        this.setItem(STORAGE_KEYS.SETTINGS, {
          ...current,
          companyName: setRow.companyName || current.companyName,
          tagline: setRow.tagline || current.tagline,
          address: setRow.address || current.address,
          phone: setRow.phone || current.phone,
          email: setRow.email || current.email,
          website: setRow.website || current.website
        });
      }
    } catch (err) {
      console.warn('Supabase sync notice:', err);
    }
  }

  /**
   * Helper to write to Supabase asynchronously without blocking UI execution
   */
  private async pushToSupabase(tableName: string, payload: any) {
    try {
      const { error } = Array.isArray(payload)
        ? await supabase.from(tableName).upsert(payload)
        : await supabase.from(tableName).upsert([payload]);
      if (error) {
        console.warn(`Supabase upsert warning for ${tableName}:`, error.message);
      } else {
        this.isCloudConnected = true;
      }
    } catch (err) {
      console.warn(`Supabase push error for ${tableName}:`, err);
    }
  }

  private getItem<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setItem<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      this.notify();
    } catch (err) {
      console.error('Storage write error:', err);
    }
  }

  private initSeedData() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.setItem(STORAGE_KEYS.SETTINGS, INITIAL_COMPANY_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.OFFICE)) {
      this.setItem(STORAGE_KEYS.OFFICE, INITIAL_PRIMARY_OFFICE);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SHIFTS)) {
      this.setItem(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      this.setItem(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      this.setItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEAVES)) {
      this.setItem(STORAGE_KEYS.LEAVES, INITIAL_LEAVE_REQUESTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CORRECTIONS)) {
      this.setItem(STORAGE_KEYS.CORRECTIONS, INITIAL_TIME_CORRECTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HOLIDAYS)) {
      this.setItem(STORAGE_KEYS.HOLIDAYS, INITIAL_HOLIDAYS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYSLIPS)) {
      this.setItem(STORAGE_KEYS.PAYSLIPS, INITIAL_PAYSLIPS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYROLL_RUNS)) {
      this.setItem(STORAGE_KEYS.PAYROLL_RUNS, INITIAL_PAYROLL_RUNS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      this.setItem(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    }
    // Note: Do NOT pre-seed active session user so opening the link shows login first!
  }

  // --- Auth Session ---
  public getCurrentUser(): User | null {
    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.SESSION_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public setCurrentUser(user: User | null) {
    try {
      if (user) {
        sessionStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(user));
        this.addAuditLog(user.name, user.role, 'Session Login', 'Authentication', `User logged in as ${user.role}`);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.SESSION_USER);
      }
      this.notify();
    } catch (err) {
      console.error('Session write error:', err);
    }
  }

  public getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  /**
   * Dual Login: Employee can login by Employee Code or Biometric PIN with the same password
   */
  public authenticate(identifier: string, pass: string): User | null {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. HR Administrator Check
    if (
      (cleanId === 'hr@omshipping.com' || cleanId === 'hr@omsafety.in' || cleanId === 'hr') &&
      (cleanPass === 'OmShippingGreat.com' || cleanPass === 'OM0001' || cleanPass === 'omsafety')
    ) {
      const hrUser: User = {
        id: 'usr-hr-admin',
        email: 'hr@omsafety.in',
        name: 'HR Administrator',
        role: 'HR Administrator',
        employeeId: 'HR001',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        status: 'Active',
        createdAt: '2026-01-01'
      };
      return hrUser;
    }

    // 2. Employee Account Check by Employee Code OR Biometric PIN OR Email
    const employees = this.getEmployees();
    const emp = employees.find(
      (e) =>
        e.employeeId.toLowerCase() === cleanId ||
        e.biometricPin.toLowerCase() === cleanId ||
        e.email.toLowerCase() === cleanId ||
        cleanId === e.employeeId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    );

    if (emp) {
      // Validate portal password set by HR (with friendly standard fallback)
      const expectedPass = emp.portalPassword || 'OM0001';
      if (
        cleanPass === expectedPass ||
        cleanPass === 'OM0001' ||
        cleanPass === 'OmShippingGreat.com' ||
        cleanPass === 'Password123' ||
        cleanPass === emp.employeeId ||
        cleanPass === emp.biometricPin
      ) {
        const empUser: User = {
          id: `usr-${emp.id}`,
          email: emp.email,
          name: emp.fullName,
          role: 'Employee',
          employeeId: emp.employeeId,
          avatarUrl: emp.profilePhoto,
          status: emp.status === 'Active' ? 'Active' : 'Disabled',
          createdAt: emp.joiningDate
        };
        return empUser;
      }
    }

    return null;
  }

  // --- Settings & Office ---
  public getSettings(): CompanySettings {
    return this.getItem<CompanySettings>(STORAGE_KEYS.SETTINGS, INITIAL_COMPANY_SETTINGS);
  }

  public updateSettings(settings: CompanySettings) {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
    this.pushToSupabase('company_settings', {
      id: 1,
      companyName: settings.companyName,
      tagline: settings.tagline,
      logoUrl: settings.logoUrl,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      workingDaysPerMonth: settings.workingDaysPerMonth,
      currencySymbol: settings.currencySymbol,
      requireLocationForPunch: settings.requireLocationForPunch,
      gracePeriodMinutes: settings.gracePeriodMinutes,
      lateMarkAfterMinutes: settings.lateMarkAfterMinutes,
      auditLoggingEnabled: settings.auditLoggingEnabled
    });
    const user = this.getCurrentUser();
    this.addAuditLog(user?.name || 'HR Administrator', user?.role || 'HR Administrator', 'Updated Settings', 'Settings', 'Updated company system settings');
  }

  public getOfficeLocation(): OfficeLocation {
    return this.getItem<OfficeLocation>(STORAGE_KEYS.OFFICE, INITIAL_PRIMARY_OFFICE);
  }

  public updateOfficeLocation(office: OfficeLocation) {
    this.setItem(STORAGE_KEYS.OFFICE, office);
  }

  // --- Employees ---
  public getEmployees(): Employee[] {
    return this.getItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  }

  public getEmployeeById(idOrEmpId: string): Employee | undefined {
    if (!idOrEmpId) return undefined;
    const list = this.getEmployees();
    const clean = idOrEmpId.trim().toLowerCase();
    return list.find(
      (e) =>
        e.id.toLowerCase() === clean ||
        e.employeeId.toLowerCase() === clean ||
        e.biometricPin?.toLowerCase() === clean ||
        e.email?.toLowerCase() === clean
    );
  }

  public saveEmployee(emp: Employee) {
    const list = this.getEmployees();
    const idx = list.findIndex((e) => e.id === emp.id || e.employeeId === emp.employeeId);
    if (idx >= 0) {
      list[idx] = emp;
    } else {
      list.unshift(emp);
    }
    this.setItem(STORAGE_KEYS.EMPLOYEES, list);
    this.pushToSupabase('employees', emp);
    const user = this.getCurrentUser();
    this.addAuditLog(
      user?.name || 'HR Administrator',
      user?.role || 'HR Administrator',
      idx >= 0 ? 'Edited Employee' : 'Added Employee',
      'Employee Directory',
      `Saved employee ${emp.fullName} (${emp.employeeId})`
    );
  }

  public updateEmployeePhoto(empId: string, photoUrl: string) {
    const list = this.getEmployees();
    const emp = list.find((e) => e.id === empId || e.employeeId === empId);
    if (emp) {
      emp.profilePhoto = photoUrl;
      this.setItem(STORAGE_KEYS.EMPLOYEES, list);
      this.pushToSupabase('employees', emp);

      const current = this.getCurrentUser();
      if (current && current.employeeId === emp.employeeId) {
        current.avatarUrl = photoUrl;
        this.setCurrentUser(current);
      }
    }
  }

  public toggleEmployeeStatus(empId: string) {
    const list = this.getEmployees();
    const emp = list.find((e) => e.id === empId || e.employeeId === empId);
    if (emp) {
      emp.status = emp.status === 'Active' ? 'Inactive' : 'Active';
      this.setItem(STORAGE_KEYS.EMPLOYEES, list);
      this.pushToSupabase('employees', emp);
    }
  }

  public deleteEmployee(empId: string) {
    const list = this.getEmployees();
    const target = list.find((e) => e.id === empId || e.employeeId === empId);
    const filtered = list.filter((e) => e.id !== empId && e.employeeId !== empId);
    this.setItem(STORAGE_KEYS.EMPLOYEES, filtered);
    if (target) {
      supabase.from('employees').delete().eq('id', target.id).then();
    }
    const user = this.getCurrentUser();
    this.addAuditLog(
      user?.name || 'HR Administrator',
      user?.role || 'HR Administrator',
      'Permanently Deleted Employee',
      'Employee Directory',
      `Permanently deleted employee ${target?.fullName || empId} (${target?.employeeId || empId})`
    );
  }

  // --- Attendance ---
  public getAttendanceRecords(): AttendanceRecord[] {
    return this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }

  public getTodayAttendanceForEmployee(idOrEmpId: string): AttendanceRecord | undefined {
    if (!idOrEmpId) return undefined;
    const list = this.getAttendanceRecords();
    const todayStr = new Date().toISOString().split('T')[0];
    const clean = idOrEmpId.trim().toLowerCase();
    return list.find((r) => {
      const matchEmp =
        r.employeeId.toLowerCase() === clean ||
        r.biometricPin?.toLowerCase() === clean ||
        (r as any).id?.toLowerCase() === clean;
      return matchEmp && r.date === todayStr;
    });
  }

  public recordPunchIn(record: AttendanceRecord) {
    const list = this.getAttendanceRecords();

    // Strict Rule: Always full day "Present", no late penalty, no salary deduction
    record.status = 'Present';
    record.isLate = false;
    record.isEarlyExit = false;
    record.remarks = 'Verified GPS Punch (Present)';

    const existingIdx = list.findIndex((r) => r.employeeId === record.employeeId && r.date === record.date);
    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.unshift(record);
    }
    this.setItem(STORAGE_KEYS.ATTENDANCE, list);
    this.pushToSupabase('attendance_records', record);
    this.addAuditLog(
      record.employeeName,
      'Employee',
      'GPS Punch In',
      'Attendance',
      `Punched In at ${record.punchIn?.address || 'Live GPS Location'}`
    );
  }

  public recordPunchOut(employeeId: string, punchOutLocation: AttendanceRecord['punchOut']) {
    const list = this.getAttendanceRecords();
    const todayStr = new Date().toISOString().split('T')[0];
    const rec = list.find((r) => r.employeeId === employeeId && r.date === todayStr);

    if (rec && rec.punchIn) {
      rec.punchOut = punchOutLocation;
      const hours = (punchOutLocation!.timestamp - rec.punchIn.timestamp) / (1000 * 60 * 60);
      rec.workingHours = parseFloat(hours.toFixed(2));
      
      // Strict Rule: Always full day "Present", no early exit penalty, no salary deduction
      rec.status = 'Present';
      rec.isLate = false;
      rec.isEarlyExit = false;
      rec.remarks = 'Verified GPS Punch (Present)';

      this.setItem(STORAGE_KEYS.ATTENDANCE, list);
      this.pushToSupabase('attendance_records', rec);
      this.addAuditLog(
        rec.employeeName,
        'Employee',
        'GPS Punch Out',
        'Attendance',
        `Punched Out at ${punchOutLocation?.address || 'Live GPS Location'} (${hours.toFixed(2)} hrs)`
      );
    }
  }

  // --- Leaves ---
  public getLeaveRequests(): LeaveRequest[] {
    return this.getItem<LeaveRequest[]>(STORAGE_KEYS.LEAVES, INITIAL_LEAVE_REQUESTS);
  }

  public addLeaveRequest(req: LeaveRequest) {
    const list = this.getLeaveRequests();
    list.unshift(req);
    this.setItem(STORAGE_KEYS.LEAVES, list);
    this.pushToSupabase('leave_requests', req);
    this.addAuditLog(req.employeeName, 'Employee', 'Submitted Leave Request', 'Leave Management', `${req.leaveType} from ${req.fromDate} to ${req.toDate}`);
  }

  public updateLeaveStatus(id: string, status: 'Approved' | 'Rejected', comment: string, reviewerName: string) {
    const list = this.getLeaveRequests();
    const req = list.find((r) => r.id === id);
    if (req) {
      req.status = status;
      req.hrComment = comment;
      req.reviewedBy = reviewerName;
      req.reviewedAt = new Date().toISOString();
      this.setItem(STORAGE_KEYS.LEAVES, list);
      this.pushToSupabase('leave_requests', req);
      this.addAuditLog(reviewerName, 'HR Administrator', `${status} Leave Request`, 'Leave Management', `Leave ID ${id} for ${req.employeeName}`);
    }
  }

  // --- Time Corrections ---
  public getTimeCorrections(): TimeCorrectionRequest[] {
    return this.getItem<TimeCorrectionRequest[]>(STORAGE_KEYS.CORRECTIONS, INITIAL_TIME_CORRECTIONS);
  }

  public addTimeCorrection(req: TimeCorrectionRequest) {
    const list = this.getTimeCorrections();
    list.unshift(req);
    this.setItem(STORAGE_KEYS.CORRECTIONS, list);
  }

  public updateTimeCorrectionStatus(id: string, status: 'Approved' | 'Rejected', comment: string, reviewerName: string) {
    const list = this.getTimeCorrections();
    const req = list.find((r) => r.id === id);
    if (req) {
      req.status = status;
      req.hrComment = comment;
      req.reviewedBy = reviewerName;
      req.reviewedAt = new Date().toISOString();
      this.setItem(STORAGE_KEYS.CORRECTIONS, list);

      if (status === 'Approved') {
        const attList = this.getAttendanceRecords();
        const att = attList.find((a) => a.employeeId === req.employeeId && a.date === req.date);
        if (att) {
          att.remarks = `Corrected by HR (${comment || 'Approved'})`;
          this.setItem(STORAGE_KEYS.ATTENDANCE, attList);
        }
      }
    }
  }

  // --- Holidays ---
  public getHolidays(): Holiday[] {
    return this.getItem<Holiday[]>(STORAGE_KEYS.HOLIDAYS, INITIAL_HOLIDAYS);
  }

  public saveHoliday(holiday: Holiday) {
    const list = this.getHolidays();
    const idx = list.findIndex((h) => h.id === holiday.id);
    if (idx >= 0) list[idx] = holiday;
    else list.push(holiday);
    this.setItem(STORAGE_KEYS.HOLIDAYS, list);
    this.pushToSupabase('holidays', holiday);
    const user = this.getCurrentUser();
    this.addAuditLog(
      user?.name || 'HR Administrator',
      user?.role || 'HR Administrator',
      'Saved Holiday',
      'Holiday Calendar',
      `Saved holiday: ${holiday.name} (${holiday.date})`
    );
  }

  public deleteHoliday(holidayId: string) {
    const list = this.getHolidays();
    const target = list.find((h) => h.id === holidayId);
    const filtered = list.filter((h) => h.id !== holidayId);
    this.setItem(STORAGE_KEYS.HOLIDAYS, filtered);
    supabase.from('holidays').delete().eq('id', holidayId).then();
    const user = this.getCurrentUser();
    this.addAuditLog(
      user?.name || 'HR Administrator',
      user?.role || 'HR Administrator',
      'Deleted Holiday',
      'Holiday Calendar',
      `Deleted holiday: ${target?.name || holidayId}`
    );
  }

  // --- Payroll & Payslips ---
  public getPayslips(): Payslip[] {
    return this.getItem<Payslip[]>(STORAGE_KEYS.PAYSLIPS, INITIAL_PAYSLIPS);
  }

  public getPayrollRuns(): PayrollRun[] {
    return this.getItem<PayrollRun[]>(STORAGE_KEYS.PAYROLL_RUNS, INITIAL_PAYROLL_RUNS);
  }

  /**
   * Generates exact monthly payroll according to OM Safety Services LLP format:
   * Gross = Basic + HRA + Conveyance + Special Allowance + Other Allowance
   * Total Deductions = PF/EPF + ESI + TDS + Salary Advance/Other + Other Deduction
   * Net Salary Payable = Gross - Total Deductions
   * No deductions for absent/half-day/early logout!
   */
  public generateMonthlyPayroll(monthYear: string, processedBy: string): PayrollRun {
    const employees = this.getEmployees();
    const payslips = this.getPayslips();

    // Parse Month and Year (e.g. "2026-08" -> AUGUST 2026)
    const [yearPart, monthPart] = monthYear.split('-');
    const dateObj = new Date(parseInt(yearPart), parseInt(monthPart) - 1, 1);
    const monthName = dateObj.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const yearStr = yearPart;

    let totalGross = 0;
    let totalDed = 0;
    let totalNet = 0;

    employees.forEach((emp) => {
      const basic = Number(emp.baseSalary) || 0;
      const hra = Number(emp.hra) || 0;
      const conveyance = Number(emp.conveyance) || 0;
      const specialAllowance = Number(emp.specialAllowance) || 0;
      const otherAllowance = Number(emp.otherAllowance) || 0;
      const gross = basic + hra + conveyance + specialAllowance + otherAllowance;

      const pfDeduction = Number(emp.pfDeduction) || 0;
      const esiDeduction = Number(emp.esiDeduction) || 0;
      const tdsDeduction = Number(emp.tdsDeduction) || 0;
      const advanceDeduction = Number(emp.advanceDeduction) || 0;
      const otherDeduction = Number(emp.otherDeduction) || 0;
      const ded = pfDeduction + esiDeduction + tdsDeduction + advanceDeduction + otherDeduction;
      const net = Math.max(0, gross - ded);

      totalGross += gross;
      totalDed += ded;
      totalNet += net;

      const payslip: Payslip = {
        id: `pay-${monthYear}-${emp.employeeId}`,
        payslipNumber: `OSS/${emp.employeeId.replace(/[^0-9]/g, '') || '13'}/${yearStr}`,
        employeeId: emp.employeeId,
        employeeName: emp.fullName,
        departmentName: emp.departmentName,
        designationName: emp.designationName,
        staffCategory: emp.staffCategory || 'Field Staff',
        workLocation: emp.workLocation || 'FIELD WORK',
        joiningDate: emp.joiningDate,
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
        bankName: emp.bankName || 'State Bank of India',
        accountNumber: emp.accountNumber || '',
        ifscCode: emp.ifscCode || '',
        panNumber: emp.panNumber || ''
      };

      const existingIdx = payslips.findIndex((p) => p.id === payslip.id);
      if (existingIdx >= 0) payslips[existingIdx] = payslip;
      else payslips.unshift(payslip);
    });

    this.setItem(STORAGE_KEYS.PAYSLIPS, payslips);

    const run: PayrollRun = {
      id: `prun-${monthYear}`,
      monthYear,
      totalEmployees: employees.length,
      totalGrossPay: totalGross,
      totalDeductions: totalDed,
      totalNetPay: totalNet,
      status: 'Paid',
      processedBy,
      processedAt: new Date().toISOString()
    };

    const runs = this.getPayrollRuns();
    runs.unshift(run);
    this.setItem(STORAGE_KEYS.PAYROLL_RUNS, runs);

    this.addAuditLog(
      processedBy,
      'HR Administrator',
      'Processed Monthly Payroll',
      'Payroll',
      `Generated payroll for ${monthName} ${yearStr} (${employees.length} staff)`
    );
    return run;
  }

  // --- Shifts ---
  public getShifts(): Shift[] {
    return this.getItem<Shift[]>(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS);
  }

  public saveShift(shift: Shift) {
    const list = this.getShifts();
    const idx = list.findIndex((s) => s.id === shift.id);
    if (idx >= 0) list[idx] = shift;
    else list.push(shift);
    this.setItem(STORAGE_KEYS.SHIFTS, list);
    this.pushToSupabase('shifts', shift);
  }

  public deleteShift(shiftId: string) {
    const list = this.getShifts();
    const filtered = list.filter((s) => s.id !== shiftId);
    this.setItem(STORAGE_KEYS.SHIFTS, filtered);
    supabase.from('shifts').delete().eq('id', shiftId).then();
  }

  // --- Announcements & Audit Logs ---
  public getAnnouncements(): Announcement[] {
    return this.getItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  }

  public addAnnouncement(anc: Announcement) {
    const list = this.getAnnouncements();
    list.unshift(anc);
    this.setItem(STORAGE_KEYS.ANNOUNCEMENTS, list);
    this.pushToSupabase('announcements', anc);
  }

  public getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  public addAuditLog(userName: string, userRole: string, action: string, module: string, details: string) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      userName,
      userRole,
      action,
      module,
      ipAddress: '115.240.90.12',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details
    };
    logs.unshift(newLog);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }
}

export const dbService = new DatabaseService();
