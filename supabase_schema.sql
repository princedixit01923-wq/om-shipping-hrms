-- ====================================================================
-- OM SHIPPING LTD. - HRMS BY PRIVA
-- COMPLETE SUPABASE DATABASE SCHEMA (DDL + SEED DATA)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SHIFTS TABLE
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "gracePeriodMins" INTEGER DEFAULT 15,
  "breakDurationMins" INTEGER DEFAULT 60,
  "workingHours" NUMERIC DEFAULT 8.5,
  "weeklyOff" JSONB DEFAULT '["Sunday"]'::jsonb,
  "isOvernight" BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  title TEXT DEFAULT 'Mr.',
  "firstName" TEXT NOT NULL,
  "middleName" TEXT,
  "lastName" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "motherFullName" TEXT,
  "fatherFullName" TEXT,
  nationality TEXT DEFAULT 'Indian',
  "employeeId" TEXT UNIQUE NOT NULL,
  "biometricPin" TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  "portalPassword" TEXT DEFAULT 'OM0001',
  mobile TEXT NOT NULL,
  "alternateMobile" TEXT,
  gender TEXT DEFAULT 'Male',
  dob DATE NOT NULL,
  "bloodGroup" TEXT DEFAULT 'Unknown',
  "maritalStatus" TEXT DEFAULT 'Single',
  "spouseName" TEXT,
  "joiningDate" DATE NOT NULL,
  "profilePhoto" TEXT,
  address TEXT,
  status TEXT DEFAULT 'Active',
  "departmentName" TEXT NOT NULL,
  "designationName" TEXT NOT NULL,
  "staffCategory" TEXT DEFAULT 'Field Staff',
  "workLocation" TEXT DEFAULT 'FIELD WORK',
  "shiftId" TEXT REFERENCES shifts(id) ON DELETE SET NULL,
  "shiftName" TEXT NOT NULL,
  "baseSalary" NUMERIC DEFAULT 22000,
  hra NUMERIC DEFAULT 0,
  conveyance NUMERIC DEFAULT 0,
  "specialAllowance" NUMERIC DEFAULT 0,
  "otherAllowance" NUMERIC DEFAULT 0,
  "pfDeduction" NUMERIC DEFAULT 0,
  "esiDeduction" NUMERIC DEFAULT 0,
  "tdsDeduction" NUMERIC DEFAULT 0,
  "advanceDeduction" NUMERIC DEFAULT 0,
  "otherDeduction" NUMERIC DEFAULT 0,
  "bankName" TEXT,
  "accountNumber" TEXT,
  "ifscCode" TEXT,
  "panNumber" TEXT,
  "aadhaarNumber" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure newly added columns exist in previously provisioned databases
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "workLocation" TEXT DEFAULT 'FIELD WORK';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hra NUMERIC DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS conveyance NUMERIC DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "specialAllowance" NUMERIC DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "otherAllowance" NUMERIC DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "pfDeduction" NUMERIC DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "esiDeduction" NUMERIC DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "tdsDeduction" NUMERIC DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "advanceDeduction" NUMERIC DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "otherDeduction" NUMERIC DEFAULT 0;

-- 3. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  "biometricPin" TEXT NOT NULL,
  "departmentName" TEXT NOT NULL,
  "staffCategory" TEXT DEFAULT 'Office Staff',
  date DATE NOT NULL,
  "punchIn" JSONB,
  "punchOut" JSONB,
  "workingHours" NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Present',
  "isLate" BOOLEAN DEFAULT false,
  "isEarlyExit" BOOLEAN DEFAULT false,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  "departmentName" TEXT NOT NULL,
  "leaveType" TEXT NOT NULL,
  "fromDate" DATE NOT NULL,
  "toDate" DATE NOT NULL,
  "totalDays" INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  "hrComment" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TIME CORRECTION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS time_corrections (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  "departmentName" TEXT NOT NULL,
  date DATE NOT NULL,
  "currentPunchIn" TEXT,
  "currentPunchOut" TEXT,
  "requestedPunchIn" TEXT NOT NULL,
  "requestedPunchOut" TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  "hrComment" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  "dayOfWeek" TEXT NOT NULL,
  type TEXT DEFAULT 'National',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PAYROLL RUNS TABLE
CREATE TABLE IF NOT EXISTS payroll_runs (
  id TEXT PRIMARY KEY,
  "monthYear" TEXT NOT NULL,
  "totalEmployees" INTEGER NOT NULL,
  "totalGrossPay" NUMERIC NOT NULL,
  "totalDeductions" NUMERIC NOT NULL,
  "totalNetPay" NUMERIC NOT NULL,
  status TEXT DEFAULT 'Paid',
  "processedBy" TEXT NOT NULL,
  "processedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PAYSLIPS TABLE
CREATE TABLE IF NOT EXISTS payslips (
  id TEXT PRIMARY KEY,
  "payslipNumber" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  "departmentName" TEXT NOT NULL,
  "designationName" TEXT NOT NULL,
  "joiningDate" DATE NOT NULL,
  "payPeriod" TEXT NOT NULL,
  "paidDays" INTEGER DEFAULT 26,
  "lopDays" INTEGER DEFAULT 0,
  "basicSalary" NUMERIC NOT NULL,
  hra NUMERIC NOT NULL,
  conveyance NUMERIC NOT NULL,
  "specialAllowance" NUMERIC NOT NULL,
  "grossSalary" NUMERIC NOT NULL,
  "pfDeduction" NUMERIC NOT NULL,
  "esiDeduction" NUMERIC DEFAULT 0,
  "ptDeduction" NUMERIC NOT NULL,
  "tdsDeduction" NUMERIC NOT NULL,
  "totalDeductions" NUMERIC NOT NULL,
  "netPay" NUMERIC NOT NULL,
  "netPayInWords" TEXT NOT NULL,
  status TEXT DEFAULT 'Finalized',
  "generatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  "targetAudience" TEXT DEFAULT 'All Employees',
  "publishedBy" TEXT NOT NULL,
  "publishedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  "userName" TEXT NOT NULL,
  "userRole" TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  "ipAddress" TEXT DEFAULT '127.0.0.1',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details TEXT
);

-- 11. COMPANY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  "companyName" TEXT DEFAULT 'OM Shipping Ltd.',
  tagline TEXT DEFAULT 'HRMS By Priva',
  "logoUrl" TEXT,
  address TEXT DEFAULT 'Corporate Headquarters, Port Terminal, Mumbai',
  phone TEXT DEFAULT '+91 22 4910 8800',
  email TEXT DEFAULT 'hr@omshipping.com',
  website TEXT DEFAULT 'https://omshipping.com',
  "workingDaysPerMonth" INTEGER DEFAULT 26,
  "currencySymbol" TEXT DEFAULT '₹',
  "requireLocationForPunch" BOOLEAN DEFAULT true,
  "gracePeriodMinutes" INTEGER DEFAULT 15,
  "lateMarkAfterMinutes" INTEGER DEFAULT 15,
  "auditLoggingEnabled" BOOLEAN DEFAULT true
);

-- DISABLE ROW LEVEL SECURITY FOR OPEN ANONYMOUS APIS OR ALLOW ALL FOR DEMO / PRODUCTION ACCESS
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_corrections DISABLE ROW LEVEL SECURITY;
ALTER TABLE holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE payslips DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;

-- SEED SHIFTS
INSERT INTO shifts (id, name, "startTime", "endTime", "gracePeriodMins", "breakDurationMins", "workingHours", "weeklyOff", "isOvernight")
VALUES 
  ('sh-1', 'Morning Operational Shift', '09:00', '17:30', 15, 60, 8.5, '["Sunday"]'::jsonb, false),
  ('sh-2', 'Evening Shift', '16:00', '00:30', 15, 60, 8.5, '["Sunday"]'::jsonb, false),
  ('sh-3', 'Night Shift', '00:00', '08:30', 15, 60, 8.5, '["Sunday"]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- SEED CORPORATE EMPLOYEES INCLUDING JOHN FITZGERALD DOE (OM0001)
INSERT INTO employees (
  id, title, "firstName", "middleName", "lastName", "fullName", "motherFullName", "fatherFullName",
  nationality, "employeeId", "biometricPin", email, "portalPassword", mobile, "alternateMobile",
  gender, dob, "bloodGroup", "maritalStatus", "spouseName", "joiningDate", "profilePhoto", address,
  status, "departmentName", "designationName", "shiftId", "shiftName", "baseSalary"
)
VALUES
  (
    'emp-om0001', 'Mr.', 'John', 'Fitzgerald', 'Doe', 'Mr. John Fitzgerald Doe', 'Mary Doe', 'Robert Doe',
    'Indian', 'OM0001', '1024', 'john.doe@omshipping.com', 'OM0001', '+91 9876543210', '+91 9876543211',
    'Male', '1990-05-15', 'O+', 'Married', 'Jane Doe', '2024-01-10', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'Corporate Headquarters, Mumbai', 'Active', 'Fleet Operations', 'Chief Marine Superintendent', 'sh-1', 'Morning Operational Shift', 85000
  ),
  (
    'emp-1009', 'Mr.', 'ANIKET', '', 'SINGH', 'Mr. ANIKET SINGH', 'Sunita Singh', 'Ramesh Singh',
    'Indian', 'PIN: 1009', '1009', 'aniket.singh@omshipping.com', 'OM0001', '+91 9811223344', '+91 9811223345',
    'Male', '1992-08-20', 'A+', 'Single', '', '2025-03-01', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'Mumbai Maritime Hub', 'Active', 'Fleet Operations', 'Port Engineer', 'sh-1', 'Morning Operational Shift', 60000
  ),
  (
    'emp-rahul', 'Mr.', 'Rahul', '', 'Patel', 'Mr. Rahul Patel', 'Kiran Patel', 'Suresh Patel',
    'Indian', 'OM0005', '1005', 'rahul.patel@omshipping.com', 'OM0001', '+91 9822334455', '+91 9822334456',
    'Male', '1993-11-12', 'B+', 'Married', 'Pooja Patel', '2025-06-15', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    'Gujarat Vessel Base', 'Active', 'Logistics & Supply Chain', 'Senior Logistics Specialist', 'sh-1', 'Morning Operational Shift', 65000
  )
ON CONFLICT (id) DO NOTHING;

-- SEED COMPANY SETTINGS
INSERT INTO company_settings (id, "companyName", tagline, address, phone, email, website)
VALUES (1, 'OM Shipping Ltd.', 'HRMS By Priva', 'Corporate Headquarters, Port Terminal, Mumbai', '+91 22 4910 8800', 'hr@omshipping.com', 'https://omshipping.com')
ON CONFLICT (id) DO NOTHING;
