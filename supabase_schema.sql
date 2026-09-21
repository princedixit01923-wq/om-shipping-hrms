-- ====================================================================
-- OM SAFETY SERVICES LLP - HRMS DATABASE SCHEMA
-- COMPLETE SUPABASE DDL + ROW-LEVEL SECURITY FIX + SEED DATA
-- Project ID: nyhycxpymyaifqyieslt
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 2. DDL: TABLE DEFINITIONS
-- ====================================================================

-- 2.1 SHIFTS TABLE
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

-- 2.2 EMPLOYEES TABLE
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

-- Ensure all new columns exist on existing databases
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "staffCategory" TEXT DEFAULT 'Field Staff';
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
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "ifscCode" TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "panNumber" TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "aadhaarNumber" TEXT;

-- 2.3 ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  "biometricPin" TEXT NOT NULL,
  "departmentName" TEXT NOT NULL,
  "staffCategory" TEXT DEFAULT 'Field Staff',
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

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS "staffCategory" TEXT DEFAULT 'Field Staff';

-- 2.4 LEAVE REQUESTS TABLE
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

-- 2.5 TIME CORRECTION REQUESTS TABLE
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

-- 2.6 HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  "dayOfWeek" TEXT NOT NULL,
  type TEXT DEFAULT 'National',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.7 PAYROLL RUNS TABLE
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

-- 2.8 PAYSLIPS TABLE
CREATE TABLE IF NOT EXISTS payslips (
  id TEXT PRIMARY KEY,
  "payslipNumber" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  "departmentName" TEXT NOT NULL,
  "designationName" TEXT NOT NULL,
  "staffCategory" TEXT DEFAULT 'Field Staff',
  "workLocation" TEXT DEFAULT 'FIELD WORK',
  "joiningDate" DATE NOT NULL,
  "payPeriod" TEXT NOT NULL,
  "paidDays" INTEGER DEFAULT 26,
  "lopDays" INTEGER DEFAULT 0,
  "basicSalary" NUMERIC NOT NULL,
  hra NUMERIC NOT NULL DEFAULT 0,
  conveyance NUMERIC NOT NULL DEFAULT 0,
  "specialAllowance" NUMERIC NOT NULL DEFAULT 0,
  "otherAllowance" NUMERIC NOT NULL DEFAULT 0,
  "grossSalary" NUMERIC NOT NULL,
  "pfDeduction" NUMERIC NOT NULL DEFAULT 0,
  "esiDeduction" NUMERIC DEFAULT 0,
  "ptDeduction" NUMERIC NOT NULL DEFAULT 0,
  "tdsDeduction" NUMERIC NOT NULL DEFAULT 0,
  "advanceDeduction" NUMERIC NOT NULL DEFAULT 0,
  "otherDeduction" NUMERIC NOT NULL DEFAULT 0,
  "totalDeductions" NUMERIC NOT NULL,
  "netPay" NUMERIC NOT NULL,
  "netPayInWords" TEXT NOT NULL,
  status TEXT DEFAULT 'Finalized',
  "generatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.9 ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  "targetAudience" TEXT DEFAULT 'All Employees',
  "publishedBy" TEXT NOT NULL,
  "publishedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.10 AUDIT LOGS TABLE
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

-- 2.11 COMPANY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  "companyName" TEXT DEFAULT 'OM Safety Services LLP',
  tagline TEXT DEFAULT 'ONCE WITH US SAFE WITH US',
  "logoUrl" TEXT,
  address TEXT DEFAULT 'Gandhidham, Gujarat, India - 370201',
  phone TEXT DEFAULT '+91 2836 230000',
  email TEXT DEFAULT 'info@omsafetyservices.com',
  website TEXT DEFAULT 'https://omsafetyservices.com',
  "workingDaysPerMonth" INTEGER DEFAULT 26,
  "currencySymbol" TEXT DEFAULT '₹',
  "requireLocationForPunch" BOOLEAN DEFAULT true,
  "gracePeriodMinutes" INTEGER DEFAULT 15,
  "lateMarkAfterMinutes" INTEGER DEFAULT 15,
  "auditLoggingEnabled" BOOLEAN DEFAULT true
);

-- ====================================================================
-- 3. PERMISSIONS & ROW LEVEL SECURITY (RLS) FIX
-- Allow seamless cross-device synchronization on phone, laptop & web
-- ====================================================================

-- 3.1 Disable RLS on all operational tables
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

-- 3.2 Grant full schema access to anon, authenticated and service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 3.3 Ensure permissive fallback policies exist in case RLS is ever toggled
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public_access" ON public.%I;', t);
    EXECUTE format('CREATE POLICY "public_access" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;

-- ====================================================================
-- 4. SEED DATA FOR OM SAFETY SERVICES LLP
-- ====================================================================

-- 4.1 Seed Standard Shifts (Shift A for Sales/Finance & Flexible for Technical)
INSERT INTO shifts (id, name, "startTime", "endTime", "gracePeriodMins", "breakDurationMins", "workingHours", "weeklyOff", "isOvernight")
VALUES 
  ('sh-1', 'Shift A (General Day)', '10:00', '19:00', 15, 60, 9.0, '["Sunday"]'::jsonb, false),
  ('sh-2', 'Technical Field Shift (Flexible Anytime)', '00:00', '23:59', 0, 60, 8.5, '["Sunday"]'::jsonb, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "startTime" = EXCLUDED."startTime",
  "endTime" = EXCLUDED."endTime",
  "workingHours" = EXCLUDED."workingHours";

-- 4.2 Seed Standard Employees (Representing 3 Official Departments)
INSERT INTO employees (
  id, title, "firstName", "middleName", "lastName", "fullName", "motherFullName", "fatherFullName",
  nationality, "employeeId", "biometricPin", email, "portalPassword", mobile, "alternateMobile",
  gender, dob, "bloodGroup", "maritalStatus", "spouseName", "joiningDate", "profilePhoto", address,
  status, "departmentName", "designationName", "staffCategory", "workLocation", "shiftId", "shiftName",
  "baseSalary", hra, conveyance, "specialAllowance", "otherAllowance", "pfDeduction", "esiDeduction",
  "tdsDeduction", "advanceDeduction", "otherDeduction", "bankName", "accountNumber", "ifscCode", "panNumber", "aadhaarNumber"
)
VALUES
  (
    'emp-om0001', 'Mr.', 'John', 'Fitzgerald', 'Doe', 'Mr. John Fitzgerald Doe', 'Mary Doe', 'Robert Doe',
    'Indian', 'OM0001', '1024', 'john.doe@omsafetyservices.com', 'OM0001', '+91 9876543210', '+91 9876543211',
    'Male', '1990-05-15', 'O+', 'Married', 'Jane Doe', '2024-01-10', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'Corporate Office, Gandhidham, Gujarat', 'Active', 'Sales Department', 'Senior Sales Executive', 'Office Staff', 'GANDHIDHAM OFFICE', 'sh-1', 'Shift A (General Day)',
    45000, 10000, 3000, 5000, 2000, 1800, 0, 1500, 0, 0, 'HDFC Bank', '50100234567890', 'HDFC0001234', 'ABCDE1234F', '123456789012'
  ),
  (
    'emp-1009', 'Mr.', 'ANIKET', '', 'SINGH', 'Mr. ANIKET SINGH', 'Sunita Singh', 'Ramesh Singh',
    'Indian', '1009', '1009', 'aniket.singh@omsafetyservices.com', 'OM0001', '+91 9811223344', '+91 9811223345',
    'Male', '1992-08-20', 'A+', 'Single', '', '2025-03-01', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'Port Terminal, Kandla / Mundra', 'Active', 'Technical Department', 'Marine Safety Field Inspector', 'Field Staff', 'FIELD WORK', 'sh-2', 'Technical Field Shift (Flexible Anytime)',
    35000, 8000, 4000, 3000, 1500, 1800, 0, 1000, 0, 0, 'State Bank of India', '30291827364', 'SBIN0004567', 'XYZPK9876L', '987654321098'
  ),
  (
    'emp-rahul', 'Mr.', 'Rahul', '', 'Patel', 'Mr. Rahul Patel', 'Kiran Patel', 'Suresh Patel',
    'Indian', 'OM0005', '1005', 'rahul.patel@omsafetyservices.com', 'OM0001', '+91 9822334455', '+91 9822334456',
    'Male', '1993-11-12', 'B+', 'Married', 'Pooja Patel', '2025-06-15', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    'Finance Wing, Gandhidham Base', 'Active', 'Finance Department', 'Accounts & Payroll Officer', 'Office Staff', 'GANDHIDHAM OFFICE', 'sh-1', 'Shift A (General Day)',
    40000, 9000, 2500, 4000, 1000, 1800, 0, 1200, 0, 0, 'ICICI Bank', '1092837465', 'ICIC0000987', 'LMNOP4567Q', '456789012345'
  )
ON CONFLICT (id) DO UPDATE SET
  "departmentName" = EXCLUDED."departmentName",
  "staffCategory" = EXCLUDED."staffCategory",
  "workLocation" = EXCLUDED."workLocation",
  "baseSalary" = EXCLUDED."baseSalary",
  hra = EXCLUDED.hra,
  conveyance = EXCLUDED.conveyance,
  "specialAllowance" = EXCLUDED."specialAllowance",
  "otherAllowance" = EXCLUDED."otherAllowance",
  "pfDeduction" = EXCLUDED."pfDeduction",
  "esiDeduction" = EXCLUDED."esiDeduction",
  "tdsDeduction" = EXCLUDED."tdsDeduction",
  "advanceDeduction" = EXCLUDED."advanceDeduction",
  "otherDeduction" = EXCLUDED."otherDeduction";

-- 4.3 Seed Company Profile
INSERT INTO company_settings (id, "companyName", tagline, address, phone, email, website)
VALUES (1, 'OM Safety Services LLP', 'ONCE WITH US SAFE WITH US', 'Gandhidham, Gujarat, India - 370201', '+91 2836 230000', 'info@omsafetyservices.com', 'https://omsafetyservices.com')
ON CONFLICT (id) DO UPDATE SET
  "companyName" = EXCLUDED."companyName",
  tagline = EXCLUDED.tagline,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  website = EXCLUDED.website;

-- 4.4 Seed Official Holidays
INSERT INTO holidays (id, name, date, "dayOfWeek", type, description)
VALUES
  ('hol-1', 'Republic Day', '2026-01-26', 'Monday', 'National', 'Celebration of the Constitution of India'),
  ('hol-2', 'Maha Shivratri', '2026-02-17', 'Tuesday', 'Religious', 'Maha Shivratri celebration'),
  ('hol-3', 'Holi (Dhuleti)', '2026-03-04', 'Wednesday', 'Cultural', 'Festival of Colours'),
  ('hol-4', 'Eid-ul-Fitr', '2026-03-21', 'Saturday', 'Religious', 'Islamic holiday'),
  ('hol-5', 'Good Friday', '2026-04-03', 'Friday', 'Religious', 'Christian holiday'),
  ('hol-6', 'Independence Day', '2026-08-15', 'Saturday', 'National', 'Indian Independence Day celebration'),
  ('hol-7', 'Mahatma Gandhi Jayanti', '2026-10-02', 'Friday', 'National', 'Birthday of Mahatma Gandhi'),
  ('hol-8', 'Diwali (Deepavali)', '2026-11-08', 'Sunday', 'Cultural', 'Festival of Lights'),
  ('hol-9', 'New Year Day', '2027-01-01', 'Friday', 'National', 'New Year celebration')
ON CONFLICT (id) DO NOTHING;

-- 4.5 Seed Announcements
INSERT INTO announcements (id, title, description, priority, "targetAudience", "publishedBy", "publishedAt")
VALUES
  ('anc-1', 'Welcome to OM Safety Services LLP HR Portal', 'Welcome all team members to our unified attendance, leave, and payroll portal.', 'High', 'All Employees', 'HR Administrator', NOW())
ON CONFLICT (id) DO NOTHING;
