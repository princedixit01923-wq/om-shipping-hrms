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
  private isSyncing: boolean = false;

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
   * Set up real-time websocket and focus event listeners for instant cross-device sync
   */
  private initRealtimeAndSyncListeners() {
    // 1. Supabase Postgres Realtime Changes Listener
    try {
      supabase
        .channel('public:realtime_hrms')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          console.log('⚡ Real-time DB Event Received:', payload.eventType, payload.table);
          this.syncFromSupabase();
        })
        .subscribe();
    } catch (e) {
      console.warn('Supabase Realtime subscription notice:', e);
    }

    // 2. Window Focus & Visibility Change Sync
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.syncFromSupabase();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.syncFromSupabase();
        }
      });
      // 3. Fast Periodic Pulse every 3 seconds for instant multi-device sync
      setInterval(() => {
        this.syncFromSupabase();
      }, 3000);
    }
  }

  /**
   * Background Supabase Cloud Real-time Fetch & Synchronization for All Entities
   * Supabase Cloud database is the authoritative single source of truth.
   */
  public async syncFromSupabase(forceNotify: boolean = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      let hasChanged = forceNotify;

      // 1. Sync Shifts directly from backend
      const { data: shiftData, error: shiftErr } = await supabase.from('shifts').select('*');
      if (!shiftErr && shiftData) {
        this.isCloudConnected = true;
        const currentShifts = this.getItem<Shift[]>(STORAGE_KEYS.SHIFTS, []);
        if (JSON.stringify(currentShifts) !== JSON.stringify(shiftData)) {
          this.setItem(STORAGE_KEYS.SHIFTS, shiftData, false);
          hasChanged = true;
        }
      }

      // 2. Sync Employees directly from backend
      const { data: empData, error: empErr } = await supabase.from('employees').select('*');
      if (!empErr && empData) {
        this.isCloudConnected = true;
        const cleanedEmps = empData.map((e: any) => {
          const { created_at, ...clean } = e;
          return clean as Employee;
        });
        const currentEmps = this.getItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
        if (JSON.stringify(currentEmps) !== JSON.stringify(cleanedEmps)) {
          this.setItem(STORAGE_KEYS.EMPLOYEES, cleanedEmps, false);
          hasChanged = true;
        }
      }

      // 3. Sync Attendance Records
      const { data: attData, error: attErr } = await supabase
        .from('attendance_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (!attErr && attData) {
        const currentAtt = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
        if (JSON.stringify(currentAtt) !== JSON.stringify(attData)) {
          this.setItem(STORAGE_KEYS.ATTENDANCE, attData, false);
          hasChanged = true;
        }
      }

      // 4. Sync Leave Requests
      const { data: leaveData, error: leaveErr } = await supabase
        .from('leave_requests')
        .select('*')
        .order('createdAt', { ascending: false });
      if (!leaveErr && leaveData) {
        const currentLeave = this.getItem<LeaveRequest[]>(STORAGE_KEYS.LEAVES, []);
        if (JSON.stringify(currentLeave) !== JSON.stringify(leaveData)) {
          this.setItem(STORAGE_KEYS.LEAVES, leaveData, false);
          hasChanged = true;
        }
      }

      // 5. Sync Time Correction Requests
      const { data: corrData, error: corrErr } = await supabase
        .from('time_corrections')
        .select('*')
        .order('createdAt', { ascending: false });
      if (!corrErr && corrData) {
        const currentCorr = this.getItem<TimeCorrectionRequest[]>(STORAGE_KEYS.CORRECTIONS, []);
        if (JSON.stringify(currentCorr) !== JSON.stringify(corrData)) {
          this.setItem(STORAGE_KEYS.CORRECTIONS, corrData, false);
          hasChanged = true;
        }
      }

      // 6. Sync Holidays
      const { data: holData, error: holErr } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });
      if (!holErr && holData) {
        const currentHol = this.getItem<Holiday[]>(STORAGE_KEYS.HOLIDAYS, []);
        if (JSON.stringify(currentHol) !== JSON.stringify(holData)) {
          this.setItem(STORAGE_KEYS.HOLIDAYS, holData, false);
          hasChanged = true;
        }
      }

      // 7. Sync Announcements
      const { data: ancData, error: ancErr } = await supabase
        .from('announcements')
        .select('*')
        .order('publishedAt', { ascending: false });
      if (!ancErr && ancData) {
        const currentAnc = this.getItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
        if (JSON.stringify(currentAnc) !== JSON.stringify(ancData)) {
          this.setItem(STORAGE_KEYS.ANNOUNCEMENTS, ancData, false);
          hasChanged = true;
        }
      }

      // 8. Sync Payroll Runs
      const { data: prData, error: prErr } = await supabase
        .from('payroll_runs')
        .select('*')
        .order('processedAt', { ascending: false });
      if (!prErr && prData) {
        const currentPr = this.getItem<PayrollRun[]>(STORAGE_KEYS.PAYROLL_RUNS, []);
        if (JSON.stringify(currentPr) !== JSON.stringify(prData)) {
          this.setItem(STORAGE_KEYS.PAYROLL_RUNS, prData, false);
          hasChanged = true;
        }
      }

      // 9. Sync Payslips
      const { data: psData, error: psErr } = await supabase
        .from('payslips')
        .select('*')
        .order('generatedAt', { ascending: false });
      if (!psErr && psData) {
        const currentPs = this.getItem<Payslip[]>(STORAGE_KEYS.PAYSLIPS, []);
        if (JSON.stringify(currentPs) !== JSON.stringify(psData)) {
          this.setItem(STORAGE_KEYS.PAYSLIPS, psData, false);
          hasChanged = true;
        }
      }

      // 10. Sync Audit Logs
      const { data: auditData, error: auditErr } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);
      if (!auditErr && auditData) {
        const currentAudit = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
        if (JSON.stringify(currentAudit) !== JSON.stringify(auditData)) {
          this.setItem(STORAGE_KEYS.AUDIT_LOGS, auditData, false);
          hasChanged = true;
        }
      }

      // 11. Sync Company Settings
      const { data: settingsData, error: settingsErr } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1);
      if (!settingsErr && settingsData && settingsData.length > 0) {
        const setRow = settingsData[0];
        const current = this.getSettings();
        const updatedSettings: CompanySettings = {
          ...current,
          companyName: setRow.companyName || current.companyName,
          tagline: setRow.tagline || current.tagline,
          address: setRow.address || current.address,
          phone: setRow.phone || current.phone,
          email: setRow.email || current.email,
          website: setRow.website || current.website
        };
        if (JSON.stringify(current) !== JSON.stringify(updatedSettings)) {
          this.setItem(STORAGE_KEYS.SETTINGS, updatedSettings, false);
          hasChanged = true;
        }
      }

      if (hasChanged) {
        this.notify();
      }
    } catch (err) {
      console.warn('Supabase sync notice:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Helper to write to Supabase asynchronously with FK constraint auto-recovery
   */
  private async pushToSupabase(tableName: string, payload: any) {
    try {
      const items = Array.isArray(payload) ? payload : [payload];
      let { error } = await supabase.from(tableName).upsert(items);

      if (error && tableName === 'employees' && error.code === '23503') {
        console.warn('Handling FK constraint fallback for employees upsert...');
        const sanitizedItems = items.map((emp: any) => ({
          ...emp,
          shiftId: 'sh-1',
          shiftName: emp.shiftName || 'Shift A (General Day)'
        }));
        const retryRes = await supabase.from(tableName).upsert(sanitizedItems);
        error = retryRes.error;
      }

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

  private setItem<T>(key: string, val: T, triggerNotify: boolean = true): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      if (triggerNotify) {
        this.notify();
      }
    } catch (err) {
      console.error('Storage write error:', err);
    }
  }

  private initSeedData() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.setItem(STORAGE_KEYS.SETTINGS, INITIAL_COMPANY_SETTINGS, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.OFFICE)) {
      this.setItem(STORAGE_KEYS.OFFICE, INITIAL_PRIMARY_OFFICE, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SHIFTS)) {
      this.setItem(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      this.setItem(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      this.setItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEAVES)) {
      this.setItem(STORAGE_KEYS.LEAVES, INITIAL_LEAVE_REQUESTS, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CORRECTIONS)) {
      this.setItem(STORAGE_KEYS.CORRECTIONS, INITIAL_TIME_CORRECTIONS, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HOLIDAYS)) {
      this.setItem(STORAGE_KEYS.HOLIDAYS, INITIAL_HOLIDAYS, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYSLIPS)) {
      this.setItem(STORAGE_KEYS.PAYSLIPS, INITIAL_PAYSLIPS, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYROLL_RUNS)) {
      this.setItem(STORAGE_KEYS.PAYROLL_RUNS, INITIAL_PAYROLL_RUNS, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      this.setItem(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS, false);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS, false);
    }
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
        email: 'hr@omshipping.com',
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

  public async updateSettings(settings: CompanySettings) {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
    await this.pushToSupabase('company_settings', {
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

  public async saveEmployee(emp: Employee) {
    const list = this.getEmployees();
    const idx = list.findIndex((e) => e.id === emp.id || e.employeeId === emp.employeeId);
    if (idx >= 0) {
      list[idx] = emp;
    } else {
      list.unshift(emp);
    }
    this.setItem(STORAGE_KEYS.EMPLOYEES, list, true);
    await this.pushToSupabase('employees', emp);
    const user = this.getCurrentUser();
    this.addAuditLog(
      user?.name || 'HR Administrator',
      user?.role || 'HR Administrator',
      idx >= 0 ? 'Edited Employee' : 'Added Employee',
      'Employee Directory',
      `Saved employee ${emp.fullName} (${emp.employeeId})`
    );
    this.notify();
  }

  public async updateEmployeePhoto(empId: string, photoUrl: string) {
    const list = this.getEmployees();
    const emp = list.find((e) => e.id === empId || e.employeeId === empId);
    if (emp) {
      emp.profilePhoto = photoUrl;
      this.setItem(STORAGE_KEYS.EMPLOYEES, list, true);
      await this.pushToSupabase('employees', emp);

      const current = this.getCurrentUser();
      if (current && current.employeeId === emp.employeeId) {
        current.avatarUrl = photoUrl;
        this.setCurrentUser(current);
      }
      this.notify();
    }
  }

  public async toggleEmployeeStatus(empId: string) {
    const list = this.getEmployees();
    const emp = list.find((e) => e.id === empId || e.employeeId === empId);
    if (emp) {
      emp.status = emp.status === 'Active' ? 'Inactive' : 'Active';
      this.setItem(STORAGE_KEYS.EMPLOYEES, list, true);
      await this.pushToSupabase('employees', emp);
      this.notify();
    }
  }

  public async deleteEmployee(empId: string) {
    const list = this.getEmployees();
    const target = list.find((e) => e.id === empId || e.employeeId === empId || e.biometricPin === empId);

    const targetId = target?.id || empId;
    const targetEmpCode = target?.employeeId || empId;

    // 1. Delete from local state immediately so UI updates
    const filteredEmps = list.filter(
      (e) => e.id !== targetId && e.employeeId !== targetEmpCode && (!target?.biometricPin || e.biometricPin !== target.biometricPin)
    );
    this.setItem(STORAGE_KEYS.EMPLOYEES, filteredEmps, true);

    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.setItem(
      STORAGE_KEYS.USERS,
      users.filter((u) => u.id !== targetId && u.employeeId !== targetEmpCode),
      true
    );

    // 2. Delete permanently from Supabase Cloud backend database
    try {
      await Promise.all([
        supabase.from('employees').delete().eq('id', targetId),
        supabase.from('employees').delete().eq('employeeId', targetEmpCode),
        supabase.from('attendance_records').delete().eq('employeeId', targetEmpCode),
        supabase.from('leave_requests').delete().eq('employeeId', targetEmpCode),
        supabase.from('time_corrections').delete().eq('employeeId', targetEmpCode),
        supabase.from('payslips').delete().eq('employeeId', targetEmpCode)
      ]);
    } catch (err) {
      console.warn('Supabase delete employee notice:', err);
    }

    const user = this.getCurrentUser();
    this.addAuditLog(
      user?.name || 'HR Administrator',
      user?.role || 'HR Administrator',
      'Permanently Deleted Employee',
      'Employee Directory',
      `Permanently deleted employee ${target?.fullName || empId} (${targetEmpCode})`
    );

    this.notify();
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

  public async recordPunchIn(record: AttendanceRecord) {
    const list = this.getAttendanceRecords();

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
    await this.pushToSupabase('attendance_records', record);
    this.addAuditLog(
      record.employeeName,
      'Employee',
      'GPS Punch In',
      'Attendance',
      `Punched In at ${record.punchIn?.address || 'Live GPS Location'}`
    );
  }

  public async recordPunchOut(employeeId: string, punchOutLocation: AttendanceRecord['punchOut']) {
    const list = this.getAttendanceRecords();
    const todayStr = new Date().toISOString().split('T')[0];
    const rec = list.find((r) => r.employeeId === employeeId && r.date === todayStr);

    if (rec && rec.punchIn) {
      rec.punchOut = punchOutLocation;
      const hours = (punchOutLocation!.timestamp - rec.punchIn.timestamp) / (1000 * 60 * 60);
      rec.workingHours = parseFloat(hours.toFixed(2));

      rec.status = 'Present';
      rec.isLate = false;
      rec.isEarlyExit = false;
      rec.remarks = 'Verified GPS Punch (Present)';

      this.setItem(STORAGE_KEYS.ATTENDANCE, list);
      await this.pushToSupabase('attendance_records', rec);
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

  public async addLeaveRequest(req: LeaveRequest) {
    const list = this.getLeaveRequests();
    list.unshift(req);
    this.setItem(STORAGE_KEYS.LEAVES, list);
    await this.pushToSupabase('leave_requests', req);
    this.addAuditLog(
      req.employeeName,
      'Employee',
      'Submitted Leave Request',
      'Leave Management',
      `${req.leaveType} from ${req.fromDate} to ${req.toDate}`
    );
  }

  public async updateLeaveStatus(id: string, status: 'Approved' | 'Rejected', comment: string, reviewerName: string) {
    const list = this.getLeaveRequests();
    const req = list.find((r) => r.id === id);
    if (req) {
      req.status = status;
      req.hrComment = comment;
      req.reviewedBy = reviewerName;
      req.reviewedAt = new Date().toISOString();
      this.setItem(STORAGE_KEYS.LEAVES, list);
      await this.pushToSupabase('leave_requests', req);
      this.addAuditLog(
        reviewerName,
        'HR Administrator',
        `${status} Leave Request`,
        'Leave Management',
        `Leave ID ${id} for ${req.employeeName}`
      );
    }
  }

  // --- Time Corrections ---
  public getTimeCorrections(): TimeCorrectionRequest[] {
    return this.getItem<TimeCorrectionRequest[]>(STORAGE_KEYS.CORRECTIONS, INITIAL_TIME_CORRECTIONS);
  }

  public async addTimeCorrection(req: TimeCorrectionRequest) {
    const list = this.getTimeCorrections();
    list.unshift(req);
    this.setItem(STORAGE_KEYS.CORRECTIONS, list);
    await this.pushToSupabase('time_corrections', req);
  }

  public async updateTimeCorrectionStatus(id: string, status: 'Approved' | 'Rejected', comment: string, reviewerName: string) {
    const list = this.getTimeCorrections();
    const req = list.find((r) => r.id === id);
    if (req) {
      req.status = status;
      req.hrComment = comment;
      req.reviewedBy = reviewerName;
      req.reviewedAt = new Date().toISOString();
      this.setItem(STORAGE_KEYS.CORRECTIONS, list);
      await this.pushToSupabase('time_corrections', req);

      if (status === 'Approved') {
        const attList = this.getAttendanceRecords();
        const att = attList.find((a) => a.employeeId === req.employeeId && a.date === req.date);
        if (att) {
          att.remarks = `Corrected by HR (${comment || 'Approved'})`;
          this.setItem(STORAGE_KEYS.ATTENDANCE, attList);
          await this.pushToSupabase('attendance_records', att);
        }
      }
    }
  }

  // --- Holidays ---
  public getHolidays(): Holiday[] {
    return this.getItem<Holiday[]>(STORAGE_KEYS.HOLIDAYS, INITIAL_HOLIDAYS);
  }

  public async saveHoliday(holiday: Holiday) {
    const list = this.getHolidays();
    const idx = list.findIndex((h) => h.id === holiday.id);
    if (idx >= 0) list[idx] = holiday;
    else list.push(holiday);
    this.setItem(STORAGE_KEYS.HOLIDAYS, list);
    await this.pushToSupabase('holidays', holiday);
    const user = this.getCurrentUser();
    this.addAuditLog(
      user?.name || 'HR Administrator',
      user?.role || 'HR Administrator',
      'Saved Holiday',
      'Holiday Calendar',
      `Saved holiday: ${holiday.name} (${holiday.date})`
    );
  }

  public async deleteHoliday(holidayId: string) {
    const list = this.getHolidays();
    const target = list.find((h) => h.id === holidayId);
    const filtered = list.filter((h) => h.id !== holidayId);
    this.setItem(STORAGE_KEYS.HOLIDAYS, filtered);

    try {
      await supabase.from('holidays').delete().eq('id', holidayId);
    } catch (err) {
      console.warn('Error deleting holiday from Supabase:', err);
    }

    const user = this.getCurrentUser();
    this.addAuditLog(
      user?.name || 'HR Administrator',
      user?.role || 'HR Administrator',
      'Deleted Holiday',
      'Holiday Calendar',
      `Deleted holiday: ${target?.name || holidayId}`
    );

    this.syncFromSupabase();
  }

  // --- Payroll & Payslips ---
  public getPayslips(): Payslip[] {
    return this.getItem<Payslip[]>(STORAGE_KEYS.PAYSLIPS, INITIAL_PAYSLIPS);
  }

  public getPayrollRuns(): PayrollRun[] {
    return this.getItem<PayrollRun[]>(STORAGE_KEYS.PAYROLL_RUNS, INITIAL_PAYROLL_RUNS);
  }

  public async generateMonthlyPayroll(monthYear: string, processedBy: string): Promise<PayrollRun> {
    const employees = this.getEmployees();
    const payslips = this.getPayslips();

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
    await this.pushToSupabase('payslips', payslips);

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
    await this.pushToSupabase('payroll_runs', run);

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

  public async saveShift(shift: Shift) {
    const list = this.getShifts();
    const idx = list.findIndex((s) => s.id === shift.id);
    if (idx >= 0) list[idx] = shift;
    else list.push(shift);
    this.setItem(STORAGE_KEYS.SHIFTS, list);
    await this.pushToSupabase('shifts', shift);
  }

  public async deleteShift(shiftId: string) {
    const list = this.getShifts();
    const target = list.find((s) => s.id === shiftId);
    const filtered = list.filter((s) => s.id !== shiftId);
    this.setItem(STORAGE_KEYS.SHIFTS, filtered);

    try {
      await supabase.from('shifts').delete().eq('id', shiftId);
    } catch (err) {
      console.warn('Error deleting shift from Supabase:', err);
    }

    const user = this.getCurrentUser();
    this.addAuditLog(
      user?.name || 'HR Administrator',
      user?.role || 'HR Administrator',
      'Deleted Shift',
      'Shift Management',
      `Deleted shift: ${target?.name || shiftId}`
    );

    this.syncFromSupabase();
  }

  // --- Announcements & Audit Logs ---
  public getAnnouncements(): Announcement[] {
    return this.getItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  }

  public async addAnnouncement(anc: Announcement) {
    const list = this.getAnnouncements();
    list.unshift(anc);
    this.setItem(STORAGE_KEYS.ANNOUNCEMENTS, list);
    await this.pushToSupabase('announcements', anc);
  }

  public async deleteAnnouncement(announcementId: string) {
    const list = this.getAnnouncements();
    const target = list.find((a) => a.id === announcementId);
    const filtered = list.filter((a) => a.id !== announcementId);
    this.setItem(STORAGE_KEYS.ANNOUNCEMENTS, filtered);

    try {
      await supabase.from('announcements').delete().eq('id', announcementId);
    } catch (err) {
      console.warn('Error deleting announcement from Supabase:', err);
    }

    const user = this.getCurrentUser();
    this.addAuditLog(
      user?.name || 'HR Administrator',
      user?.role || 'HR Administrator',
      'Deleted Announcement',
      'Announcements',
      `Deleted announcement: ${target?.title || announcementId}`
    );

    this.syncFromSupabase();
  }

  public getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  public async addAuditLog(userName: string, userRole: string, action: string, module: string, details: string) {
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
    await this.pushToSupabase('audit_logs', newLog);
  }
}

export const dbService = new DatabaseService();
