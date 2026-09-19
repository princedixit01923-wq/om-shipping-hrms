import React, { useState, useEffect } from 'react';
import { User, CompanySettings, OfficeLocation } from './types';
import { dbService } from './services/dbService';
import { LoginForm } from './components/auth/LoginForm';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';

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

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => dbService.getCurrentUser());
  const [settings, setSettings] = useState<CompanySettings>(() => dbService.getSettings());
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation>(() => dbService.getOfficeLocation());
  const [activeTab, setActiveTab] = useState<string>('emp-dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const unsub = dbService.subscribe(() => {
      setSettings(dbService.getSettings());
      setOfficeLocation(dbService.getOfficeLocation());
      setCurrentUser(dbService.getCurrentUser());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'Employee') {
        setActiveTab('emp-dashboard');
      } else {
        setActiveTab('hr-dashboard');
      }
    }
  }, [currentUser?.id, currentUser?.role]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'Employee') {
      setActiveTab('emp-dashboard');
    } else {
      setActiveTab('hr-dashboard');
    }
  };

  const handleLogout = () => {
    dbService.setCurrentUser(null);
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} settings={settings} />;
  }

  const currentEmployee = dbService.getEmployeeById(currentUser.employeeId || 'OM0001') || dbService.getEmployees()[0];

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* Fixed Top Header Bar */}
      <Header
        user={currentUser}
        onLogout={handleLogout}
        onToggleSidebarMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        settings={settings}
      />

      {/* Main Layout Container (Sidebar + Scrollable Right Panel) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Fixed Pinned Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          userRole={currentUser.role}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Scrollable Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <main className="flex-1 p-4 lg:p-8 space-y-6">
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
              <HRDashboard onNavigateTab={(tab) => setActiveTab(tab)} settings={settings} officeLocation={officeLocation} />
            )}
            {activeTab === 'hr-map' && <AttendanceLocationMap officeLocation={officeLocation} />}
            {activeTab === 'hr-attendance' && <AttendanceTable />}
            {activeTab === 'hr-reports' && <ReportsViewer />}
            {activeTab === 'hr-leaves' && <LeaveApprovals />}
            {activeTab === 'hr-corrections' && <TimeCorrectionApprovals />}
            {activeTab === 'hr-employees' && <EmployeeDirectory />}
            {activeTab === 'hr-payroll' && <PayrollProcessor settings={settings} />}
            {activeTab === 'hr-shifts' && <ShiftManager />}
            {activeTab === 'hr-announcements' && <AnnouncementManager />}
            {activeTab === 'hr-audit' && <AuditLogsTable />}
            {activeTab === 'hr-settings' && <SettingsManager settings={settings} officeLocation={officeLocation} />}
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
