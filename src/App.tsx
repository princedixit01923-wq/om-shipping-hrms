import React, { useState, useEffect, useMemo } from 'react';
import { User, CompanySettings, OfficeLocation, Employee } from './types';
import { dbService } from './services/dbService';
import { LoginForm } from './components/auth/LoginForm';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Employee Portal Views
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { MyProfile } from './components/employee/MyProfile';
import { LeaveApplication } from './components/employee/LeaveApplication';
import { TimeCorrection } from './components/employee/TimeCorrection';
import { HolidayCalendar } from './components/employee/HolidayCalendar';
import { MyPayslips } from './components/employee/MyPayslips';
import { AnnouncementsView } from './components/employee/AnnouncementsView';

// HR / Admin Portal Views
import { HRDashboard } from './components/hr/HRDashboard';
import { AttendanceLocationMap } from './components/hr/AttendanceLocationMap';
import { AttendanceTable } from './components/hr/AttendanceTable';
import { LeaveApprovals } from './components/hr/LeaveApprovals';
import { TimeCorrectionApprovals } from './components/hr/TimeCorrectionApprovals';
import { EmployeeDirectory } from './components/hr/EmployeeDirectory';
import { PayrollProcessor } from './components/hr/PayrollProcessor';
import { ShiftManager } from './components/hr/ShiftManager';
import { AnnouncementManager } from './components/hr/AnnouncementManager';
import { ReportsViewer } from './components/hr/ReportsViewer';
import { AuditLogsTable } from './components/hr/AuditLogsTable';
import { SettingsManager } from './components/hr/SettingsManager';
import { HolidayManager } from './components/hr/HolidayManager';

import { ArrowLeft } from 'lucide-react';

const TAB_TO_PATH: Record<string, { path: string; title: string }> = {
  'emp-dashboard': { path: '/employeepage', title: 'OM Safety Services LLP - Employee Portal' },
  'emp-profile': { path: '/employee-profile', title: 'My Profile - OM Safety Services LLP' },
  'emp-attendance': { path: '/employee-attendance', title: 'My Attendance - OM Safety Services LLP' },
  'emp-leaves': { path: '/employee-leaves', title: 'Leave Application - OM Safety Services LLP' },
  'emp-corrections': { path: '/employee-corrections', title: 'Time Correction - OM Safety Services LLP' },
  'emp-holidays': { path: '/employee-holidays', title: 'Holiday Calendar - OM Safety Services LLP' },
  'emp-payslips': { path: '/employee-payslips', title: 'My Salary Slips - OM Safety Services LLP' },
  'emp-announcements': { path: '/employee-announcements', title: 'Company Circulars - OM Safety Services LLP' },

  'hr-dashboard': { path: '/hrdashboard', title: 'OM Safety Services LLP - HR Dashboard' },
  'hr-map': { path: '/hr-map', title: 'GPS Location Map - OM Safety Services LLP' },
  'hr-attendance': { path: '/hr-attendance', title: 'Attendance Register - OM Safety Services LLP' },
  'hr-reports': { path: '/hr-reports', title: 'HR Reports & Analytics - OM Safety Services LLP' },
  'hr-leaves': { path: '/hr-leaves', title: 'Leave Approvals - OM Safety Services LLP' },
  'hr-corrections': { path: '/hr-corrections', title: 'Time Correction Approvals - OM Safety Services LLP' },
  'hr-employees': { path: '/hr-employees', title: 'Employee Directory - OM Safety Services LLP' },
  'hr-payroll': { path: '/hr-payroll', title: 'Payroll Processor - OM Safety Services LLP' },
  'hr-holidays': { path: '/hr-holidays', title: 'Holiday Manager - OM Safety Services LLP' },
  'hr-shifts': { path: '/hr-shifts', title: 'Shift Management - OM Safety Services LLP' },
  'hr-announcements': { path: '/hr-announcements', title: 'Announcements - OM Safety Services LLP' },
  'hr-audit': { path: '/hr-audit', title: 'Security Audit Logs - OM Safety Services LLP' },
  'hr-settings': { path: '/hr-settings', title: 'System Settings - OM Safety Services LLP' }
};

const PATH_TO_TAB: Record<string, string> = {
  '/employeepage': 'emp-dashboard',
  '/employee-dashboard': 'emp-dashboard',
  '/employee': 'emp-dashboard',
  '/employee-profile': 'emp-profile',
  '/employee-attendance': 'emp-attendance',
  '/employee-leaves': 'emp-leaves',
  '/employee-corrections': 'emp-corrections',
  '/employee-holidays': 'emp-holidays',
  '/employee-payslips': 'emp-payslips',
  '/employee-announcements': 'emp-announcements',

  '/hrdashboard': 'hr-dashboard',
  '/hr-dashboard': 'hr-dashboard',
  '/hr': 'hr-dashboard',
  '/hr-map': 'hr-map',
  '/hr-attendance': 'hr-attendance',
  '/hr-reports': 'hr-reports',
  '/hr-leaves': 'hr-leaves',
  '/hr-corrections': 'hr-corrections',
  '/hr-employees': 'hr-employees',
  '/hr-payroll': 'hr-payroll',
  '/hr-holidays': 'hr-holidays',
  '/hr-shifts': 'hr-shifts',
  '/hr-announcements': 'hr-announcements',
  '/hr-audit': 'hr-audit',
  '/hr-settings': 'hr-settings'
};

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => dbService.getCurrentUser());
  const [settings, setSettings] = useState<CompanySettings>(() => dbService.getSettings());
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation>(() => dbService.getOfficeLocation());

  // Determine initial active tab based on current URL pathname
  const [activeTab, setActiveTab] = useState<string>(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    if (PATH_TO_TAB[path]) {
      return PATH_TO_TAB[path];
    }
    const initialUser = dbService.getCurrentUser();
    return initialUser?.role === 'Employee' ? 'emp-dashboard' : 'hr-dashboard';
  });

  const [tabHistory, setTabHistory] = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync DB state changes
  useEffect(() => {
    const unsub = dbService.subscribe(() => {
      setSettings(dbService.getSettings());
      setOfficeLocation(dbService.getOfficeLocation());
      setCurrentUser(dbService.getCurrentUser());
    });
    return () => unsub();
  }, []);

  // Update URL and document title whenever activeTab or currentUser changes
  useEffect(() => {
    if (!currentUser) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      document.title = 'OM Safety Services LLP - Login';
      return;
    }

    const routeInfo = TAB_TO_PATH[activeTab];
    if (routeInfo) {
      if (window.location.pathname !== routeInfo.path) {
        window.history.pushState(null, '', routeInfo.path);
      }
      document.title = routeInfo.title;
    }
  }, [activeTab, currentUser]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname.toLowerCase();
      const mappedTab = PATH_TO_TAB[path];
      if (mappedTab) {
        setActiveTab(mappedTab);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const homeTab = currentUser?.role === 'Employee' ? 'emp-dashboard' : 'hr-dashboard';
  const canGoBack = activeTab !== homeTab || tabHistory.length > 0;

  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      setTabHistory((prev) => [...prev, activeTab]);
      setActiveTab(newTab);
    }
  };

  const handleBack = () => {
    if (tabHistory.length > 0) {
      const prev = tabHistory[tabHistory.length - 1];
      setTabHistory((prevHistory) => prevHistory.slice(0, -1));
      setActiveTab(prev);
    } else {
      setActiveTab(homeTab);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setTabHistory([]);
    const defaultTab = user.role === 'Employee' ? 'emp-dashboard' : 'hr-dashboard';
    setActiveTab(defaultTab);
  };

  const handleLogout = () => {
    dbService.setCurrentUser(null);
    setCurrentUser(null);
    setTabHistory([]);
    if (window.location.pathname !== '/login') {
      window.history.replaceState(null, '', '/login');
    }
    document.title = 'OM Safety Services LLP - Login';
  };

  // Safe fallback Employee resolution: Guarantees currentEmployee is NEVER undefined
  const currentEmployee = useMemo<Employee>(() => {
    if (!currentUser) {
      return dbService.getEmployees()[0];
    }
    const cleanId = currentUser.employeeId || '';
    const found =
      (cleanId ? dbService.getEmployeeById(cleanId) : undefined) ||
      dbService.getEmployees().find(
        (e) =>
          e.employeeId.toLowerCase() === cleanId.toLowerCase() ||
          e.biometricPin.toLowerCase() === cleanId.toLowerCase() ||
          e.email.toLowerCase() === (currentUser.email || '').toLowerCase()
      ) ||
      dbService.getEmployees()[0];

    if (found) return found;

    // Guaranteed structural fallback so Employee views never crash
    return {
      id: 'emp-session-active',
      title: 'Mr.',
      firstName: currentUser.name.split(' ')[0] || 'Employee',
      lastName: currentUser.name.split(' ')[1] || '',
      fullName: currentUser.name || 'OM Safety Employee',
      employeeId: currentUser.employeeId || 'OM0001',
      biometricPin: '1024',
      email: currentUser.email || 'employee@omsafetyservices.com',
      portalPassword: 'OM0001',
      mobile: '+91 9909524849',
      gender: 'Male',
      dob: '1995-01-01',
      bloodGroup: 'O+',
      maritalStatus: 'Single',
      joiningDate: '2025-01-01',
      profilePhoto: currentUser.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      address: 'Gandhidham, Gujarat, India',
      status: 'Active',
      departmentName: 'Technical Department',
      designationName: 'Field Technical Specialist',
      staffCategory: 'Field Staff',
      workLocation: 'FIELD WORK',
      shiftId: 'sh-2',
      shiftName: 'Technical Field Shift (Flexible Anytime)',
      baseSalary: 25000
    };
  }, [currentUser, settings]);

  if (!currentUser) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} settings={settings} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* Fixed Top Header Bar */}
      <Header
        user={currentUser}
        onLogout={handleLogout}
        onToggleSidebarMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        settings={settings}
        canGoBack={canGoBack}
        onBack={handleBack}
      />

      {/* Main Layout Container (Sidebar + Scrollable Right Panel) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Fixed Pinned Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userRole={currentUser.role}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Scrollable Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <main className="flex-1 p-4 lg:p-8 space-y-5">
            {/* Contextual Back Button on New/Sub Open Screens */}
            {canGoBack && (
              <div className="flex items-center">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/90 text-xs font-extrabold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Return to previous screen"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-600" />
                  <span>Back to Previous Screen</span>
                </button>
              </div>
            )}

            {/* ErrorBoundary wraps view renders to prevent blank white screens */}
            <ErrorBoundary fallbackTitle="Section Display Alert">
              {/* Employee Portal Views */}
              {activeTab === 'emp-dashboard' && (
                <EmployeeDashboard employee={currentEmployee} settings={settings} officeLocation={officeLocation} />
              )}
              {activeTab === 'emp-profile' && <MyProfile employee={currentEmployee} />}
              {activeTab === 'emp-attendance' && (
                <EmployeeDashboard employee={currentEmployee} settings={settings} officeLocation={officeLocation} />
              )}
              {activeTab === 'emp-leaves' && <LeaveApplication employee={currentEmployee} />}
              {activeTab === 'emp-corrections' && <TimeCorrection employee={currentEmployee} />}
              {activeTab === 'emp-holidays' && <HolidayCalendar />}
              {activeTab === 'emp-payslips' && <MyPayslips employee={currentEmployee} settings={settings} />}
              {activeTab === 'emp-announcements' && <AnnouncementsView />}

              {/* HR Portal Views */}
              {activeTab === 'hr-dashboard' && (
                <HRDashboard onNavigateTab={(tab) => handleTabChange(tab)} settings={settings} officeLocation={officeLocation} />
              )}
              {activeTab === 'hr-map' && <AttendanceLocationMap officeLocation={officeLocation} />}
              {activeTab === 'hr-attendance' && <AttendanceTable />}
              {activeTab === 'hr-reports' && <ReportsViewer />}
              {activeTab === 'hr-leaves' && <LeaveApprovals />}
              {activeTab === 'hr-corrections' && <TimeCorrectionApprovals />}
              {activeTab === 'hr-employees' && <EmployeeDirectory />}
              {activeTab === 'hr-payroll' && <PayrollProcessor settings={settings} />}
              {activeTab === 'hr-holidays' && <HolidayManager />}
              {activeTab === 'hr-shifts' && <ShiftManager />}
              {activeTab === 'hr-announcements' && <AnnouncementManager />}
              {activeTab === 'hr-audit' && <AuditLogsTable />}
              {activeTab === 'hr-settings' && <SettingsManager settings={settings} officeLocation={officeLocation} />}
            </ErrorBoundary>
          </main>

          {/* Global Footer Requested on Every Page */}
          <footer className="w-full py-4 text-center text-xs font-semibold text-slate-500 bg-white border-t border-slate-200 mt-auto shrink-0">
            © 2026 Priva Automations - All right reserved to priva.itsoftware@gmail.com
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
