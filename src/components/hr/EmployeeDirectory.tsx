import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Download, Edit, Power, Trash2, FileSpreadsheet, Camera, Key } from 'lucide-react';
import { Employee, Shift } from '../../types';
import { dbService } from '../../services/dbService';
import { exportEmployeesToCSV, downloadEmployeeImportTemplate } from '../../services/exportService';
import { Badge } from '../common/Badge';

export const EmployeeDirectory: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // All 26 exact requested fields
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
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('Unknown');
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married' | 'Divorced' | 'Widowed'>('Single');
  const [spouseName, setSpouseName] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [departmentName, setDepartmentName] = useState('');
  const [designationName, setDesignationName] = useState('');
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
    return matchesQuery && matchesDept;
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
      setDesignationName('Senior Engineer');
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

    const autoEmpId = customEmpId.trim() || `NVD00${employees.length + 10}`;
    const autoPin = biometricPin.trim() || `${1000 + employees.length + 1}`;
    const targetShift = shifts.find((s) => s.id === selectedShiftId) || shifts[0];
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
      dob,
      bloodGroup,
      maritalStatus,
      spouseName,
      status,
      departmentName: departmentName || 'Operations',
      designationName: designationName || 'Staff Officer',
      joiningDate,
      shiftId: targetShift.id,
      shiftName: targetShift.name,
      baseSalary,
      address: address || 'Corporate Headquarters',
      profilePhoto,
      bankName: editingEmp?.bankName || 'HDFC Bank',
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-3d bg-white p-6 rounded-3xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Employee Directory & Personnel Records
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage employee profiles, biometric PINs, portal passwords & shift assignments</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadEmployeeImportTemplate()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs hover:shadow-xs active:translate-y-0.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Template CSV
          </button>
          <button
            onClick={() => exportEmployeesToCSV(filteredEmployees)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs hover:shadow-xs active:translate-y-0.5"
          >
            <Download className="w-4 h-4 text-blue-600" /> Export CSV
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn-3d-primary flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add New Employee
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-3d bg-white p-4 rounded-3xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <th className="p-3.5">Department & Designation</th>
                <th className="p-3.5">Assigned Shift</th>
                <th className="p-3.5">Contact & Password</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {filteredEmployees.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 flex items-center gap-3">
                    <img
                      src={e.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                      alt={e.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete 26-Field Employee Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-4xl w-full bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingEmp ? `Edit Staff Member - ${editingEmp.fullName}` : 'Add New Corporate Employee'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter complete personal, biometric, shift, and statutory details</p>
              </div>

              {/* Photo Upload Preview */}
              <div className="flex items-center gap-3">
                <img
                  src={profilePhoto}
                  alt="Profile Preview"
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#1d4ed8]"
                />
                <label className="px-3 py-1.5 bg-blue-50 text-[#1d4ed8] text-xs font-bold rounded-xl cursor-pointer hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Upload Photo
                  <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                </label>
              </div>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              {/* Row 1: Title, First, Middle, Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                    placeholder="e.g. Fitzgerald"
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

              {/* Row 2: Mother's Name, Father's Name, Nationality */}
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
                    placeholder="Indian"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Row 3: Custom Emp ID, Biometric PIN, Password */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CUSTOM EMPLOYEE ID / CODE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={customEmpId}
                    onChange={(e) => setCustomEmpId(e.target.value)}
                    placeholder="e.g. OM0001 (Leave blank to auto-generate)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CUSTOM BIOMETRIC PIN (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={biometricPin}
                    onChange={(e) => setBiometricPin(e.target.value)}
                    placeholder="e.g. 1024 (Leave blank to auto-generate)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PORTAL PASSWORD *</label>
                  <input
                    type="text"
                    required
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="Set employee login password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Email, Mobile, Alternate Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">EMAIL ID *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@company.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MOBILE NO *</label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ALTERNATE MOBILE NO</label>
                  <input
                    type="text"
                    value={alternateMobile}
                    onChange={(e) => setAlternateMobile(e.target.value)}
                    placeholder="+91 9876543211"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Row 5: Gender, DOB, Blood Group, Marital Status, Spouse */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DATE OF BIRTH</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
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

              {/* Row 6: Free-text Department & Designation, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DEPARTMENT (FREE-TEXT BLANK SPACE) *</label>
                  <input
                    type="text"
                    required
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder="e.g. Fleet Operations / Engineering"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DESIGNATION (FREE-TEXT BLANK SPACE) *</label>
                  <input
                    type="text"
                    required
                    value={designationName}
                    onChange={(e) => setDesignationName(e.target.value)}
                    placeholder="e.g. Senior Engineer"
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

              {/* Row 7: Date of Joining, Shift Assignment, Base Salary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">DATE OF JOINING</label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
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
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
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
