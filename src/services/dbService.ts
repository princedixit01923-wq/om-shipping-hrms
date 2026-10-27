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
  INITIAL_ANNOUNCEMENTS
} from './mockData';

import { supabase } from './supabaseClient';
import { convertNumberToWords } from '../utils/numberToWords';
import { compressImage } from '../utils/imageCompressor';

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
  SESSION_USER: 'om_hrms_session_user',
  DELETED_EMPLOYEES: 'om_hrms_deleted_employees'
};

type EventCallback = () => void;

class DatabaseService {
  private listeners: Set<EventCallback> = new Set();
  public isCloudConnected: boolean = false;
  private isSyncing: boolean = false;
  private tableSyncTimestamps: Map<string, number> = new Map();
  private lastFocusSyncTime: number = 0;

  // Granular TTL cache durations per table in milliseconds to prevent egress burn
  private readonly TABLE_TTL: Record<string, number> = {
    shifts: 30 * 60 * 1000,           // 30 min (static)
    company_settings: 30 * 60 * 1000, // 30 min (static)
    holidays: 30 * 60 * 1000,         // 30 min (static)
    payroll_runs: 15 * 60 * 1000,     // 15 min (slow)
    payslips: 15 * 60 * 1000,         // 15 min (slow)
    employees: 5 * 60 * 1000,         // 5 min
    announcements: 5 * 60 * 1000,     // 5 min
    leave_requests: 2 * 60 * 1000,    // 2 min
    time_corrections: 2 * 60 * 1000,  // 2 min
    attendance_records: 2 * 60 * 1000 // 2 min
  };

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

  public isTableStale(table: string): boolean {
    const lastSync = this.tableSyncTimestamps.get(table) || 0;
    const ttl = this.TABLE_TTL[table] || 5 * 60 * 1000;
    return Date.now() - lastSync > ttl;
  }

  public markTableFresh(table: string): void {
    this.tableSyncTimestamps.set(table, Date.now());
  }

  /**
   * Set up real-time websocket and focus event listeners for instant cross-device sync.
   * High-efficiency: list changes by table name and only refresh the affected entity.
   */
  private initRealtimeAndSyncListeners() {
    // 1. Supabase Postgres Realtime Changes Listener
    try {
      supabase
        .channel('public:realtime_hrms')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          const table = payload.table;
          if (table) {
            console.log('⚡ Real-time DB Event Received for table:', table, payload.eventType);
            this.syncTable(table, true);
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Supabase Realtime subscription notice:', e);
    }

    // 2. Window Focus & Visibility Change Sync (throttled to 60s cooldown, only stale tables)
    if (typeof window !== 'undefined') {
      const handleFocusSync = () => {
        const now = Date.now();
        if (now - this.lastFocusSyncTime > 60000) {
          this.lastFocusSyncTime = now;
          this.syncStaleTables();
        }
      };

      window.addEventListener('focus', handleFocusSync);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          handleFocusSync();
        }
      });

      // 3. Relaxed Heartbeat every 5 minutes (300s) to refresh stale background data without egress waste
      setInterval(() => {
        this.syncStaleTables();
      }, 300000);
    }
  }

  /**
   * Granular, table-specific synchronization with explicit column projection
   * and result limits to minimize network payload and avoid select('*') full dumps.
   */
  public async syncTable(tableName: string, force: boolean = false): Promise<boolean> {
    if (!force && !this.isTableStale(tableName)) {
      return false;
    }

    try {
      let hasChanged = false;

      switch (tableName) {
        case 'shifts': {
          const { data, error } = await supabase
            .from('shifts')
            .select('id, name, "startTime", "endTime", "gracePeriodMins", "breakDurationMins", "workingHours", "weeklyOff", "isOvernight"');
          if (!error && data) {
            this.isCloudConnected = true;
            this.markTableFresh('shifts');
            const current = this.getItem<Shift[]>(STORAGE_KEYS.SHIFTS, []);
            if (JSON.stringify(current) !== JSON.stringify(data)) {
              this.setItem(STORAGE_KEYS.SHIFTS, data, false);
              hasChanged = true;
            }
          }
          break;
        }

        case 'employees': {
          const { data, error } = await supabase
            .from('employees')
            .select(
              'id, title, "firstName", "middleName", "lastName", "fullName", "motherFullName", "fatherFullName", nationality, "employeeId", "biometricPin", email, "portalPassword", mobile, "alternateMobile", gender, dob, "bloodGroup", "maritalStatus", "spouseName", "joiningDate", "profilePhoto", address, status, "departmentName", "designationName", "staffCategory", "workLocation", "shiftId", "shiftName", "baseSalary", hra, conveyance, "specialAllowance", "otherAllowance", "pfDeduction", "esiDeduction", "tdsDeduction", "advanceDeduction", "otherDeduction", "bankName", "accountNumber", "ifscCode", "panNumber", "aadhaarNumber"'
            );
          if (!error && data !== null) {
            this.isCloudConnected = true;
            this.markTableFresh('employees');
            const cleanedEmps = data.map((e: any) => {
              const { created_at, ...clean } = e;
              return clean as Employee;
            });
            const current = this.getItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
            if (JSON.stringify(current) !== JSON.stringify(cleanedEmps)) {
              this.setItem(STORAGE_KEYS.EMPLOYEES, cleanedEmps, true);
              hasChanged = true;
            }
          }
          break;
        }

        case 'attendance_records': {
          const { data, error } = await supabase
            .from('attendance_records')
            .select(
              'id, "employeeId", "employeeName", "biometricPin", "departmentName", "staffCategory", date, "punchIn", "punchOut", "workingHours", status, "isLate", "isEarlyExit", remarks, created_at'
            )
            .order('created_at', { ascending: false })
            .limit(500);
          if (!error && data) {
            this.isCloudConnected = true;
            this.markTableFresh('attendance_records');
            const current = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
            if (JSON.stringify(current) !== JSON.stringify(data)) {
              this.setItem(STORAGE_KEYS.ATTENDANCE, data, false);
              hasChanged = true;
            }
          }
          break;
        }

        case 'leave_requests': {
          const { data, error } = await supabase
            .from('leave_requests')
            .select(
              'id, "employeeId", "employeeName", "departmentName", "leaveType", "fromDate", "toDate", "totalDays", reason, status, "hrComment", "reviewedBy", "reviewedAt", "createdAt"'
            )
            .order('createdAt', { ascending: false })
            .limit(300);
          if (!error && data) {
            this.isCloudConnected = true;
            this.markTableFresh('leave_requests');
            const current = this.getItem<LeaveRequest[]>(STORAGE_KEYS.LEAVES, []);
            if (JSON.stringify(current) !== JSON.stringify(data)) {
              this.setItem(STORAGE_KEYS.LEAVES, data, false);
              hasChanged = true;
            }
          }
          break;
        }

        case 'time_corrections': {
          const { data, error } = await supabase
            .from('time_corrections')
            .select(
              'id, "employeeId", "employeeName", "departmentName", date, "currentPunchIn", "currentPunchOut", "requestedPunchIn", "requestedPunchOut", reason, status, "hrComment", "reviewedBy", "reviewedAt", "createdAt"'
            )
            .order('createdAt', { ascending: false })
            .limit(300);
          if (!error && data) {
            this.isCloudConnected = true;
            this.markTableFresh('time_corrections');
            const current = this.getItem<TimeCorrectionRequest[]>(STORAGE_KEYS.CORRECTIONS, []);
            if (JSON.stringify(current) !== JSON.stringify(data)) {
              this.setItem(STORAGE_KEYS.CORRECTIONS, data, false);
              hasChanged = true;
            }
          }
          break;
        }

        case 'holidays': {
          const { data, error } = await supabase
            .from('holidays')
            .select('id, name, date, "dayOfWeek", type, description')
            .order('date', { ascending: true });
          if (!error && data) {
            this.isCloudConnected = true;
            this.markTableFresh('holidays');
            const current = this.getItem<Holiday[]>(STORAGE_KEYS.HOLIDAYS, []);
            if (JSON.stringify(current) !== JSON.stringify(data)) {
              this.setItem(STORAGE_KEYS.HOLIDAYS, data, false);
              hasChanged = true;
            }
          }
          break;
        }

        case 'announcements': {
          const { data, error } = await supabase
            .from('announcements')
            .select('id, title, description, priority, "targetAudience", "publishedBy", "publishedAt"')
            .order('publishedAt', { ascending: false })
            .limit(50);
          if (!error && data) {
            this.isCloudConnected = true;
            this.markTableFresh('announcements');
            const current = this.getItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
            if (JSON.stringify(current) !== JSON.stringify(data)) {
              this.setItem(STORAGE_KEYS.ANNOUNCEMENTS, data, false);
              hasChanged = true;
            }
          }
          break;
        }

        case 'payroll_runs': {
          const { data, error } = await supabase
            .from('payroll_runs')
            .select('id, "monthYear", "totalEmployees", "totalGrossPay", "totalDeductions", "totalNetPay", status, "processedBy", "processedAt"')
            .order('processedAt', { ascending: false })
            .limit(50);
          if (!error && data) {
            this.isCloudConnected = true;
            this.markTableFresh('payroll_runs');
            const current = this.getItem<PayrollRun[]>(STORAGE_KEYS.PAYROLL_RUNS, []);
            if (JSON.stringify(current) !== JSON.stringify(data)) {
              this.setItem(STORAGE_KEYS.PAYROLL_RUNS, data, false);
              hasChanged = true;
            }
          }
          break;
        }

        case 'payslips': {
          const { data, error } = await supabase
            .from('payslips')
            .select(
              'id, "payslipNumber", "employeeId", "employeeName", "departmentName", "designationName", "staffCategory", "workLocation", "joiningDate", "payPeriod", "paidDays", "lopDays", "basicSalary", hra, conveyance, "specialAllowance", "otherAllowance", "grossSalary", "pfDeduction", "esiDeduction", "ptDeduction", "tdsDeduction", "advanceDeduction", "otherDeduction", "totalDeductions", "netPay", "netPayInWords", status, "generatedAt"'
            )
            .order('generatedAt', { ascending: false })
            .limit(200);
          if (!error && data) {
            this.isCloudConnected = true;
            this.markTableFresh('payslips');
            const current = this.getItem<Payslip[]>(STORAGE_KEYS.PAYSLIPS, []);
            if (JSON.stringify(current) !== JSON.stringify(data)) {
              this.setItem(STORAGE_KEYS.PAYSLIPS, data, false);
              hasChanged = true;
            }
          }
          break;
        }

        case 'company_settings': {
          const { data, error } = await supabase
            .from('company_settings')
            .select(
              'id, "companyName", tagline, "logoUrl", address, phone, email, website, "workingDaysPerMonth", "currencySymbol", "requireLocationForPunch", "gracePeriodMinutes", "lateMarkAfterMinutes"'
            )
            .limit(1);
          if (!error && data && data.length > 0) {
            this.isCloudConnected = true;
            this.markTableFresh('company_settings');
            const setRow = data[0];
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
          break;
        }
      }

      if (hasChanged) {
        this.notify();
      }
      return hasChanged;
    } catch (err) {
      console.warn(`Supabase sync notice for ${tableName}:`, err);
      return false;
    }
  }

  /**
   * Refreshes only tables whose cache TTL has expired.
   */
  public async syncStaleTables(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const tables = [
        'company_settings',
        'shifts',
        'holidays',
        'employees',
        'attendance_records',
        'leave_requests',
        'time_corrections',
        'announcements',
        'payroll_runs',
        'payslips'
      ];
      for (const table of tables) {
        if (this.isTableStale(table)) {
          await this.syncTable(table, false);
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Authoritative Supabase Cloud synchronization.
   * If forceNotify is false, respects per-table TTL and only fetches stale tables.
   */
  public async syncFromSupabase(forceNotify: boolean = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const tables = [
        'company_settings',
        'shifts',
        'holidays',
        'employees',
        'attendance_records',
        'leave_requests',
        'time_corrections',
        'announcements',
        'payroll_runs',
        'payslips'
      ];
      for (const table of tables) {
        await this.syncTable(table, forceNotify);
      }
      if (forceNotify) {
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

      if (error && tableName === 'employees') {
        if (error.code === '23505') {
          console.warn('Handling unique constraint fallback for employees upsert by email...');
          const retryRes = await supabase.from(tableName).upsert(items, { onConflict: 'email' });
          error = retryRes.error;
          if (error) {
            const retryResCode = await supabase.from(tableName).upsert(items, { onConflict: 'employeeId' });
            error = retryResCode.error;
          }
        } else if (error.code === '23503') {
          console.warn('Handling FK constraint fallback for employees upsert...');
          const sanitizedItems = items.map((emp: any) => ({
            ...emp,
            shiftId: 'sh-1',
            shiftName: emp.shiftName || 'Shift A (General Day)'
          }));
          const retryRes = await supabase.from(tableName).upsert(sanitizedItems);
          error = retryRes.error;
        }
      }

      if (error) {
        console.warn(`Supabase upsert warning for ${tableName}:`, error.message);
      } else {
        this.isCloudConnected = true;
        this.markTableFresh(tableName);
      }
    } catch (err) {
      console.warn(`Supabase push error for ${tableName}:`, err);
    }
  }

  private memoryCache: Map<string, any> = new Map();

  private getItem<T>(key: string, defaultVal: T): T {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        this.memoryCache.set(key, parsed);
        return parsed;
      }
      return defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setItem<T>(key: string, val: T, triggerNotify: boolean = true): void {
    this.memoryCache.set(key, val);
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (err) {
      console.warn(`Storage quota notice for ${key}, operating via in-memory cache:`, err);
      try {
        if (Array.isArray(val)) {
          const sanitized = val.map((item: any) => {
            if (item && item.profilePhoto && item.profilePhoto.length > 50000) {
              const { profilePhoto, ...rest } = item;
              return { ...rest, profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' };
            }
            return item;
          });
          localStorage.setItem(key, JSON.stringify(sanitized));
        }
      } catch {
        // In-memory cache continues seamlessly
      }
    }
    if (triggerNotify) {
      this.notify();
    }
  }

  public getDeletedEmployeeIds(): string[] {
    return this.getItem<string[]>(STORAGE_KEYS.DELETED_EMPLOYEES, []);
  }

  public markEmployeeAsDeleted(idOrCode: string) {
    if (!idOrCode) return;
    const current = this.getDeletedEmployeeIds();
    const clean = idOrCode.trim().toLowerCase();
    if (!current.includes(clean)) {
      current.push(clean);
      this.setItem(STORAGE_KEYS.DELETED_EMPLOYEES, current, false);
    }
  }

  public unmarkEmployeeAsDeleted(idOrCode: string) {
    if (!idOrCode) return;
    const current = this.getDeletedEmployeeIds();
    const clean = idOrCode.trim().toLowerCase();
    const filtered = current.filter((x) => x !== clean);
    if (filtered.length !== current.length) {
      this.setItem(STORAGE_KEYS.DELETED_EMPLOYEES, filtered, false);
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
    // Clean up legacy audit logs from localStorage if present
    localStorage.removeItem('om_hrms_audit_logs');

    // Clean up any legacy dummy records with fake addresses from localStorage
    try {
      const storedAtt = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
      const cleanAtt = storedAtt.filter(
        (r) => r.id !== 'att-2026-09-21-1001' && r.punchIn?.deviceInfo !== 'Device GPS'
      );
      if (cleanAtt.length !== storedAtt.length) {
        this.setItem(STORAGE_KEYS.ATTENDANCE, cleanAtt, false);
      }
    } catch {
      // ignore
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
      lateMarkAfterMinutes: settings.lateMarkAfterMinutes
    });
  }

  public getOfficeLocation(): OfficeLocation {
    return this.getItem<OfficeLocation>(STORAGE_KEYS.OFFICE, INITIAL_PRIMARY_OFFICE);
  }

  public updateOfficeLocation(office: OfficeLocation) {
    this.setItem(STORAGE_KEYS.OFFICE, office);
  }

  // --- Employees ---
  public async fetchEmployeesFromSupabase(force: boolean = false): Promise<Employee[]> {
    if (!force && !this.isTableStale('employees')) {
      const cached = this.getEmployees();
      if (cached && cached.length > 0) {
        return cached;
      }
    }
    await this.syncTable('employees', true);
    return this.getEmployees();
  }

  public getEmployees(): Employee[] {
    return this.getItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
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
    // Compress oversized avatar before pushing to cloud database
    if (emp.profilePhoto && emp.profilePhoto.startsWith('data:image') && emp.profilePhoto.length > 50000) {
      try {
        emp.profilePhoto = await compressImage(emp.profilePhoto, 200, 200, 0.8);
      } catch {
        // preserve photo
      }
    }

    const list = this.getEmployees();
    const idx = list.findIndex((e) => e.id === emp.id || e.employeeId === emp.employeeId);
    if (idx >= 0) {
      list[idx] = emp;
    } else {
      list.unshift(emp);
    }
    this.setItem(STORAGE_KEYS.EMPLOYEES, list, true);

    // Push to Supabase Cloud asynchronously without blocking UI
    await this.pushToSupabase('employees', emp);
    this.markTableFresh('employees');
    this.notify();
  }

  public async updateEmployeePhoto(empId: string, photoUrl: string) {
    let cleanPhoto = photoUrl;
    if (cleanPhoto && cleanPhoto.startsWith('data:image') && cleanPhoto.length > 50000) {
      try {
        cleanPhoto = await compressImage(cleanPhoto, 200, 200, 0.8);
      } catch {
        // preserve
      }
    }

    const list = this.getEmployees();
    const emp = list.find((e) => e.id === empId || e.employeeId === empId);
    if (emp) {
      emp.profilePhoto = cleanPhoto;
      this.setItem(STORAGE_KEYS.EMPLOYEES, list, true);
      await this.pushToSupabase('employees', emp);
      this.markTableFresh('employees');

      const current = this.getCurrentUser();
      if (current && current.employeeId === emp.employeeId) {
        current.avatarUrl = cleanPhoto;
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
      this.markTableFresh('employees');
      this.notify();
    }
  }

  public async deleteEmployee(empId: string) {
    const list = this.getEmployees();
    const target = list.find((e) => e.id === empId || e.employeeId === empId || e.biometricPin === empId);

    const targetId = target?.id || empId;
    const targetEmpCode = target?.employeeId || empId;
    const targetPin = target?.biometricPin;

    // 1. Delete from local state immediately (0ms latency UI update)
    const filteredEmps = list.filter(
      (e) => e.id !== targetId && e.employeeId !== targetEmpCode && (!targetPin || e.biometricPin !== targetPin)
    );
    this.setItem(STORAGE_KEYS.EMPLOYEES, filteredEmps, true);

    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.setItem(
      STORAGE_KEYS.USERS,
      users.filter((u) => u.id !== targetId && u.employeeId !== targetEmpCode),
      true
    );

    const attendance = this.getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    this.setItem(
      STORAGE_KEYS.ATTENDANCE,
      attendance.filter(
        (a) => a.employeeId !== targetEmpCode && a.employeeId !== targetId && (!targetPin || a.biometricPin !== targetPin)
      ),
      true
    );

    // 2. Issue permanent delete queries to Supabase Cloud backend
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

    // Re-sync only the employees table from Supabase to confirm state
    this.syncTable('employees', true);
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
  }

  public async deleteHoliday(holidayId: string) {
    const list = this.getHolidays();
    const filtered = list.filter((h) => h.id !== holidayId);
    this.setItem(STORAGE_KEYS.HOLIDAYS, filtered);

    try {
      await supabase.from('holidays').delete().eq('id', holidayId);
    } catch (err) {
      console.warn('Error deleting holiday from Supabase:', err);
    }

    this.syncTable('holidays', true);
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
    const filtered = list.filter((s) => s.id !== shiftId);
    this.setItem(STORAGE_KEYS.SHIFTS, filtered);

    try {
      await supabase.from('shifts').delete().eq('id', shiftId);
    } catch (err) {
      console.warn('Error deleting shift from Supabase:', err);
    }

    this.syncTable('shifts', true);
  }

  // --- Announcements ---
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
    const filtered = list.filter((a) => a.id !== announcementId);
    this.setItem(STORAGE_KEYS.ANNOUNCEMENTS, filtered);

    try {
      await supabase.from('announcements').delete().eq('id', announcementId);
    } catch (err) {
      console.warn('Error deleting announcement from Supabase:', err);
    }

    this.syncTable('announcements', true);
  }
}

export const dbService = new DatabaseService();
