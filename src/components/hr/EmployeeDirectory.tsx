import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  Download,
  Edit,
  Power,
  Trash2,
  FileSpreadsheet,
  Camera,
  Key,
  Upload,
  Calendar,
  Check,
  FileUp,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, Shift } from '../../types';
import { dbService } from '../../services/dbService';
import { exportEmployeesToCSV, downloadEmployeeImportTemplate } from '../../services/exportService';
import { Badge } from '../common/Badge';

export const EmployeeDirectory: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Bulk Upload Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Employee Form Fields
  const [title, setTitle] = useState<'Mr.' | 'Mrs.' | 'Ms.' | 'Dr.'>('Mr.');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [motherFullName, setMotherFullName] = useState('');
  const [fatherFullName, setFatherFullName] = useState('');
  const [nationality, setNationality] = useState('Indian');
  const [customEmpId, setCustomEmpId] = useState('');
  const [biometricPin, setBiometricPin] = useState('');
  const [email, setEmail] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('1995-01-01');
  const [bloodGroup, setBloodGroup] = useState('Unknown');
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married' | 'Divorced' | 'Widowed'>('Single');
  const [spouseName, setSpouseName] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [departmentName, setDepartmentName] = useState('');
  const [designationName, setDesignationName] = useState('');
  const [staffCategory, setStaffCategory] = useState<'Office Staff' | 'Field Staff'>('Office Staff');
  const [joiningDate, setJoiningDate] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('sh-1');
  const [baseSalary, setBaseSalary] = useState(50000);
  const [address, setAddress] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');

  const reloadData = () => {
    setEmployees(dbService.getEmployees());
    setShifts(dbService.getShifts());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const filteredEmployees = employees.filter((e) => {
    const matchesQuery =
      e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.biometricPin?.includes(searchQuery) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter === 'All' || e.departmentName.toLowerCase().includes(selectedDeptFilter.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || (e.staffCategory || 'Office Staff') === selectedCategoryFilter;
    return matchesQuery && matchesDept && matchesCategory;
  });

  const handleOpenModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmp(emp);
      setTitle(emp.title || 'Mr.');
      setFirstName(emp.firstName || '');
      setMiddleName(emp.middleName || '');
      setLastName(emp.lastName || '');
      setMotherFullName(emp.motherFullName || '');
      setFatherFullName(emp.fatherFullName || '');
      setNationality(emp.nationality || 'Indian');
      setCustomEmpId(emp.employeeId || '');
      setBiometricPin(emp.biometricPin || '');
      setEmail(emp.email || '');
      setPortalPassword(emp.portalPassword || 'OM0001');
      setMobile(emp.mobile || '');
      setAlternateMobile(emp.alternateMobile || '');
      setGender(emp.gender || 'Male');
      setDob(emp.dob || '1995-01-01');
      setBloodGroup(emp.bloodGroup || 'Unknown');
      setMaritalStatus(emp.maritalStatus || 'Single');
      setSpouseName(emp.spouseName || '');
      setStatus(emp.status || 'Active');
      setDepartmentName(emp.departmentName || '');
      setDesignationName(emp.designationName || '');
      setStaffCategory(emp.staffCategory || 'Office Staff');
      setJoiningDate(emp.joiningDate || '2026-01-01');
      setSelectedShiftId(emp.shiftId || 'sh-1');
      setBaseSalary(emp.baseSalary || 50000);
      setAddress(emp.address || '');
      setProfilePhoto(emp.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
    } else {
      setEditingEmp(null);
      setTitle('Mr.');
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setMotherFullName('');
      setFatherFullName('');
      setNationality('Indian');
      setCustomEmpId('');
      setBiometricPin('');
      setEmail('');
      setPortalPassword('OM0001');
      setMobile('+91 ');
      setAlternateMobile('+91 ');
      setGender('Male');
      setDob('1995-01-01');
      setBloodGroup('O+');
      setMaritalStatus('Single');
      setSpouseName('');
      setStatus('Active');
      setDepartmentName('Fleet Operations');
      setDesignationName('Senior Logistics Officer');
      setStaffCategory('Office Staff');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setSelectedShiftId('sh-1');
      setBaseSalary(50000);
      setAddress('');
      setProfilePhoto('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
    }
    setShowModal(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !email) {
      alert('First Name and Email ID are required.');
      return;
    }

    const autoEmpId = customEmpId.trim() || `OM00${employees.length + 10}`;
    const autoPin = biometricPin.trim() || `${1000 + employees.length + 1}`;
    const targetShift = shifts.find((s) => s.id === selectedShiftId) || shifts[0] || { id: 'sh-1', name: 'General Shift' };
    const full = `${title} ${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim();

    const updated: Employee = {
      id: editingEmp ? editingEmp.id : `emp-${Date.now()}`,
      title,
      firstName,
      middleName,
      lastName,
      fullName: full,
      motherFullName,
      fatherFullName,
      nationality,
      employeeId: autoEmpId,
      biometricPin: autoPin,
      email,
      portalPassword: portalPassword || 'Password123',
      mobile,
      alternateMobile,
      gender,
      dob: dob || '1995-01-01',
      bloodGroup,
      maritalStatus,
      spouseName,
      status,
      departmentName: departmentName || 'Operations',
      designationName: designationName || 'Staff Officer',
      staffCategory: staffCategory || 'Office Staff',
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      shiftId: targetShift.id,
      shiftName: targetShift.name,
      baseSalary,
      address: address || 'Corporate Headquarters',
      profilePhoto,
      bankName: editingEmp?.bankName || 'HDFC Bank Ltd.',
      accountNumber: editingEmp?.accountNumber || '50100982341920',
      ifscCode: editingEmp?.ifscCode || 'HDFC0000240',
      panNumber: editingEmp?.panNumber || 'ABCDE1234F',
      aadhaarNumber: editingEmp?.aadhaarNumber || '1234-5678-9012'
    };

    dbService.saveEmployee(updated);
    setShowModal(false);
  };

  const handleToggleStatus = (empId: string) => {
    dbService.toggleEmployeeStatus(empId);
  };

  const handleDeleteEmployee = (emp: Employee) => {
    if (window.confirm(`Are you sure you want to delete ${emp.fullName} (${emp.employeeId}) permanently?`)) {
      dbService.deleteEmployee(emp.id);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Bulk Upload Handlers ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          alert('No employee data rows found in the selected file.');
          return;
        }

        setBulkRows(rawData);
      } catch (err) {
        console.error('File parsing error:', err);
        alert('Failed to parse file. Please upload a valid Excel (.xlsx, .xls) or CSV file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmBulkImport = () => {
    if (bulkRows.length === 0) {
      alert('No rows to import.');
      return;
    }

    setBulkImporting(true);
    let importedCount = 0;
    const defaultShift = shifts[0] || { id: 'sh-1', name: 'General Shift' };

    bulkRows.forEach((row, index) => {
      const empId =
        String(row['Employee ID'] || row['employeeId'] || row['Emp ID'] || row['ID'] || `OM${String(employees.length + index + 10).padStart(4, '0')}`).trim();
      const fName = String(row['First Name'] || row['firstName'] || row['Name'] || '').trim();
      const lName = String(row['Last Name'] || row['lastName'] || '').trim();
      const fullName =
        String(row['Full Name'] || row['fullName'] || `${fName} ${lName}`.trim() || `Employee ${empId}`).trim();
      const email = String(row['Email'] || row['email'] || `${empId.toLowerCase()}@omshippingprince.com`).trim();
      const mobile = String(row['Mobile'] || row['mobile'] || row['Phone'] || '+91 98000 00000').trim();
      const gender = (row['Gender'] || row['gender'] || 'Male') as any;
      const dobVal = String(row['Date of Birth'] || row['DOB'] || row['dob'] || '1995-01-01').trim();
      const joinVal = String(row['Joining Date'] || row['joiningDate'] || new Date().toISOString().split('T')[0]).trim();
      const dept = String(row['Department'] || row['departmentName'] || 'Operations').trim();
      const desig = String(row['Designation'] || row['designationName'] || 'Staff Officer').trim();
      const rawCategory = String(row['Staff Category'] || row['staffCategory'] || row['Category'] || '').toLowerCase();
      const category: 'Office Staff' | 'Field Staff' = rawCategory.includes('field') ? 'Field Staff' : 'Office Staff';
      const salary = Number(row['Base Salary'] || row['baseSalary'] || row['Salary'] || 50000);
      const bankName = String(row['Bank Name'] || row['bankName'] || 'HDFC Bank Ltd.').trim();
      const accountNum = String(row['Account Number'] || row['accountNumber'] || row['Account No'] || '50100982341920').trim();
      const ifsc = String(row['IFSC Code'] || row['ifscCode'] || 'HDFC0000240').trim();
      const pan = String(row['PAN Number'] || row['panNumber'] || row['PAN'] || 'ABCDE1234F').trim();
      const aadhaar = String(row['Aadhaar Number'] || row['aadhaarNumber'] || row['Aadhaar'] || '1234-5678-9012').trim();
      const addr = String(row['Address'] || row['address'] || 'Corporate Headquarters, Mumbai').trim();
      const pin = `${1000 + employees.length + index + 1}`;

      const newEmp: Employee = {
        id: `emp-bulk-${Date.now()}-${index}`,
        title: 'Mr.',
        firstName: fName || fullName.split(' ')[0] || 'Staff',
        lastName: lName || fullName.split(' ').slice(1).join(' ') || 'Member',
        fullName,
        nationality: 'Indian',
        employeeId: empId,
        biometricPin: pin,
        email,
        portalPassword: 'Password123',
        mobile,
        gender: gender === 'Female' ? 'Female' : 'Male',
        dob: dobVal,
        bloodGroup: 'Unknown',
        maritalStatus: 'Single',
        status: 'Active',
        departmentName: dept,
        designationName: desig,
        staffCategory: category,
        joiningDate: joinVal,
        shiftId: defaultShift.id,
        shiftName: defaultShift.name,
        baseSalary: salary,
        address: addr,
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bankName,
        accountNumber: accountNum,
        ifscCode: ifsc,
        panNumber: pan,
        aadhaarNumber: aadhaar
      };

      dbService.saveEmployee(newEmp);
      importedCount++;
    });

    setBulkImporting(false);
    setShowBulkModal(false);
    setBulkRows([]);
    setBulkFileName('');
    reloadData();
    alert(`Successfully imported ${importedCount} employees into the directory!`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="card-3d bg-white p-6 rounded-3xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Employee Directory & Personnel Records
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage employee profiles, biometric PINs, shifts, staff categories & bulk import</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Format */}
          <button
            onClick={() => downloadEmployeeImportTemplate()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all shadow-2xs hover:shadow-xs border border-emerald-200 active:translate-y-0.5"
            title="Download formatted sample Excel sheet for bulk employee upload"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Download Format
          </button>

          {/* Upload Bulk */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl transition-all shadow-2xs hover:shadow-xs border border-sky-200 active:translate-y-0.5"
            title="Upload multiple employees from Excel or CSV file"
          >
            <Upload className="w-4 h-4 text-sky-600" /> Upload Bulk
          </button>

          {/* Export CSV */}
          <button
            onClick={() => exportEmployeesToCSV(filteredEmployees)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs hover:shadow-xs active:translate-y-0.5"
          >
            <Download className="w-4 h-4 text-blue-600" /> Export CSV
          </button>

          {/* Add Single Employee */}
          <button
            onClick={() => handleOpenModal()}
            className="btn-3d-primary flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add New Employee
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-3d bg-white p-4 rounded-3xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, PIN, code, or email..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
          />
        </div>

        <div>
          <input
            type="text"
            value={selectedDeptFilter === 'All' ? '' : selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value || 'All')}
            placeholder="Filter by Department..."
            className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
          />
        </div>

        <div>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
          >
            <option value="All">All Categories</option>
            <option value="Office Staff">Office Staff (Fixed Shift)</option>
            <option value="Field Staff">Field Staff (Flexible Full Day)</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs font-extrabold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60">
          Total Employees: <span className="text-blue-600 ml-1">{filteredEmployees.length} Staff</span>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="card-3d bg-white rounded-3xl p-6 border border-slate-200/80">
        <div className="overflow-x-auto overflow-y-auto max-h-[550px] border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 text-slate-700 text-xs font-extrabold uppercase border-b border-slate-200 shadow-2xs">
                <th className="p-3.5">Employee Name</th>
                <th className="p-3.5">Code / PIN</th>
                <th className="p-3.5">Staff Category</th>
                <th className="p-3.5">Department & Designation</th>
                <th className="p-3.5">Assigned Shift</th>
                <th className="p-3.5">Contact & Password</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {filteredEmployees.map((e) => {
                const isField = e.staffCategory === 'Field Staff';
                return (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 flex items-center gap-3">
                      <img
                        src={e.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                        alt={e.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                      />
                      <div>
                        <span className="font-black text-slate-900 block">{e.fullName}</span>
                        <span className="text-[10px] text-slate-500 block">{e.email}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-black text-[#1d4ed8] block">{e.employeeId}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">PIN: {e.biometricPin}</span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          isField
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isField ? 'Field Staff (Flexible)' : 'Office Staff'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-slate-900 block">{e.designationName}</span>
                      <span className="text-[10px] text-slate-500 font-bold block">{e.departmentName}</span>
                    </td>
                    <td className="p-3.5 text-slate-700 font-bold">{e.shiftName}</td>
                    <td className="p-3.5">
                      <span className="text-slate-900 block">{e.mobile}</span>
                      <span className="text-[10px] text-slate-400 font-mono block flex items-center gap-1">
                        <Key className="w-3 h-3 text-slate-400" /> Pass: {e.portalPassword || 'OM0001'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <Badge status={e.status} />
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(e)}
                        className="p-2 bg-blue-50 text-[#1d4ed8] hover:bg-blue-100 rounded-xl transition-colors"
                        title="Edit Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(e.id)}
                        className={`p-2 rounded-xl transition-colors ${
                          e.status === 'Active' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={e.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(e)}
                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"
                        title="Delete Employee Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- BULK UPLOAD MODAL --- */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-black text-slate-900">Bulk Upload Employees</h2>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkRows([]);
                  setBulkFileName('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Download Template Notice */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-blue-900 block">Step 1: Download Format</span>
                <span className="text-[11px] text-blue-700 block mt-0.5">
                  Use our standardized Excel template with pre-filled sample columns and format.
                </span>
              </div>
              <button
                type="button"
                onClick={() => downloadEmployeeImportTemplate()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-blue-700 text-xs font-bold rounded-xl border border-blue-300 hover:bg-blue-100 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Download Template
              </button>
            </div>

            {/* Step 2: Upload File Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Step 2: Upload Completed File (.xlsx, .xls, .csv)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/60 hover:bg-blue-50/30 transition-all"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-800 block">
                  {bulkFileName ? bulkFileName : 'Click to select or drag and drop file here'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Step 3: Preview Table */}
            {bulkRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">
                    Preview Data ({bulkRows.length} Rows Found)
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Ready to Import
                  </span>
                </div>

                <div className="overflow-x-auto max-h-48 border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2">ID</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Department</th>
                        <th className="p-2">Base Salary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkRows.slice(0, 10).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-blue-600">{r['Employee ID'] || r['employeeId'] || '-'}</td>
                          <td className="p-2 font-semibold text-slate-900">{r['Full Name'] || r['First Name'] || '-'}</td>
                          <td className="p-2 text-slate-500">{r['Email'] || r['email'] || '-'}</td>
                          <td className="p-2 font-semibold">{r['Staff Category'] || 'Office Staff'}</td>
                          <td className="p-2 text-slate-700">{r['Department'] || '-'}</td>
                          <td className="p-2 font-bold text-slate-900">₹{r['Base Salary'] || 50000}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bulkRows.length > 10 && (
                  <span className="text-[10px] text-slate-400 italic block">
                    Showing first 10 of {bulkRows.length} rows...
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkRows([]);
                  setBulkFileName('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkRows.length === 0 || bulkImporting}
                onClick={handleConfirmBulkImport}
                className="btn-3d-emerald flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold rounded-xl disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{bulkImporting ? 'Importing Employees...' : `Confirm & Import (${bulkRows.length})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT EMPLOYEE MODAL (WITH WORKING DOB & JOINING CALENDARS) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {editingEmp ? `Edit Profile: ${editingEmp.fullName}` : 'Add New Personnel / Staff Member'}
                </h2>
                <span className="text-xs text-slate-500 mt-0.5 block">Complete employee master record details</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              {/* Row 1: Photo & Names */}
              <div className="flex flex-col sm:flex-row gap-4 items-start pb-2 border-b border-slate-100">
                <div className="relative group shrink-0 mx-auto sm:mx-0">
                  <img
                    src={profilePhoto}
                    alt="Employee Avatar"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                  />
                  <label className="absolute inset-0 bg-slate-900/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                    <Camera className="w-5 h-5" />
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1 w-full">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">TITLE</label>
                    <select
                      value={title}
                      onChange={(e) => setTitle(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">FIRST NAME *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. John"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">MIDDLE NAME</label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="Middle Name"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">LAST NAME *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Doe"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Parents & Nationality */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MOTHER'S FULL NAME</label>
                  <input
                    type="text"
                    value={motherFullName}
                    onChange={(e) => setMotherFullName(e.target.value)}
                    placeholder="Mother's Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">FATHER'S FULL NAME</label>
                  <input
                    type="text"
                    value={fatherFullName}
                    onChange={(e) => setFatherFullName(e.target.value)}
                    placeholder="Father's Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NATIONALITY</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Row 3: Employee ID, PIN, Email, Password */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">EMPLOYEE ID / CODE</label>
                  <input
                    type="text"
                    value={customEmpId}
                    onChange={(e) => setCustomEmpId(e.target.value)}
                    placeholder="e.g. OM0024 (Auto if empty)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">BIOMETRIC PIN</label>
                  <input
                    type="text"
                    value={biometricPin}
                    onChange={(e) => setBiometricPin(e.target.value)}
                    placeholder="e.g. 1024"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">OFFICIAL EMAIL *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@omshippingprince.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PORTAL PASSWORD</label>
                  <input
                    type="text"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="e.g. Password123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Row 4: Mobile Phones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PRIMARY MOBILE NUMBER *</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ALTERNATE MOBILE NUMBER</label>
                  <input
                    type="tel"
                    value={alternateMobile}
                    onChange={(e) => setAlternateMobile(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Row 5: Gender, WORKING DOB CALENDAR, Blood Group, Marital Status, Spouse */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GENDER</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* --- DATE OF BIRTH WITH CALENDAR TRIGGER FIX --- */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DATE OF BIRTH *</label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      required
                      value={dob}
                      max={new Date().toISOString().split('T')[0]}
                      onClick={(e) => (e.currentTarget as any).showPicker?.()}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer pr-9 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        input?.showPicker?.();
                        input?.focus();
                      }}
                      className="absolute right-2 p-1 text-slate-500 hover:text-blue-600 transition-colors"
                      title="Open Calendar Picker"
                    >
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">BLOOD GROUP</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="O-">O-</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MARITAL STATUS</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SPOUSE NAME</label>
                  <input
                    type="text"
                    value={spouseName}
                    onChange={(e) => setSpouseName(e.target.value)}
                    placeholder="Spouse Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Row 6: Staff Category, Department, Designation, Status */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                {/* --- STAFF CATEGORY SELECTOR --- */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">STAFF CATEGORY *</label>
                  <select
                    value={staffCategory}
                    onChange={(e) => setStaffCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Office Staff">Office Staff (Fixed Shift)</option>
                    <option value="Field Staff">Field Staff (Flexible Full Day)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DEPARTMENT *</label>
                  <input
                    type="text"
                    required
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder="e.g. Fleet Operations"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DESIGNATION *</label>
                  <input
                    type="text"
                    required
                    value={designationName}
                    onChange={(e) => setDesignationName(e.target.value)}
                    placeholder="e.g. Senior Logistics Officer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">STATUS</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Row 7: Date of Joining (Calendar Trigger), Shift Assignment, Base Salary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DATE OF JOINING *</label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      required
                      value={joiningDate}
                      onClick={(e) => (e.currentTarget as any).showPicker?.()}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer pr-9"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        input?.showPicker?.();
                        input?.focus();
                      }}
                      className="absolute right-2 p-1 text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ASSIGN WORK SHIFT</label>
                  <select
                    value={selectedShiftId}
                    onChange={(e) => setSelectedShiftId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">BASE SALARY (INR)</label>
                  <input
                    type="number"
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    placeholder="50000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Row 8: Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">RESIDENTIAL ADDRESS</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter employee permanent / current residential address..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1d4ed8] hover:bg-[#0a192f] text-white text-xs font-extrabold rounded-xl shadow-md transition-all"
                >
                  {editingEmp ? 'Save Changes' : 'Create Employee Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
