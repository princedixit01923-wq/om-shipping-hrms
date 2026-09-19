import React, { useState } from 'react';
import { User, Phone, Mail, Building, CreditCard, Shield, Camera, Lock, CheckCircle2 } from 'lucide-react';
import { Employee } from '../../types';
import { dbService } from '../../services/dbService';

interface MyProfileProps {
  employee: Employee;
}

export const MyProfile: React.FC<MyProfileProps> = ({ employee: initialEmp }) => {
  const [employee, setEmployee] = useState<Employee>(initialEmp);
  const [photoSaved, setPhotoSaved] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhotoUrl = reader.result as string;
        dbService.updateEmployeePhoto(employee.employeeId, newPhotoUrl);
        setEmployee({ ...employee, profilePhoto: newPhotoUrl });
        setPhotoSaved(true);
        setTimeout(() => setPhotoSaved(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/80 flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          <img
            src={employee.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
            alt={employee.fullName}
            className="w-24 h-24 rounded-full object-cover border-4 border-[#1d4ed8] shadow-lg"
          />
          <label className="absolute bottom-0 right-0 p-2 bg-[#1d4ed8] text-white rounded-full cursor-pointer hover:bg-[#0a192f] transition-colors shadow-md">
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-black text-slate-900">{employee.fullName}</h1>
              <p className="text-xs font-bold text-[#1d4ed8]">{employee.designationName} • {employee.departmentName}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold self-center md:self-auto">
              Status: {employee.status}
            </span>
          </div>

          {photoSaved && (
            <div className="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Profile photo updated successfully!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 font-semibold">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{employee.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{employee.mobile}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <span>Biometric PIN: {employee.biometricPin}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Sections: Personal, Employment, Bank & Statutory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/80">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-[#0a192f]" />
            Personal & Family Information
          </h3>
          <div className="space-y-3 text-xs font-semibold">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Employee Code:</span>
              <span className="font-extrabold text-[#1d4ed8]">{employee.employeeId}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Father's Name:</span>
              <span className="font-bold text-slate-900">{employee.fatherFullName || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Mother's Name:</span>
              <span className="font-bold text-slate-900">{employee.motherFullName || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Nationality:</span>
              <span className="font-bold text-slate-900">{employee.nationality || 'Indian'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Gender / DOB:</span>
              <span className="font-bold text-slate-900">{employee.gender} ({employee.dob})</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Blood Group:</span>
              <span className="font-bold text-rose-600">{employee.bloodGroup || 'Unknown'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Marital Status / Spouse:</span>
              <span className="font-bold text-slate-900">{employee.maritalStatus} {employee.spouseName ? `(${employee.spouseName})` : ''}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Residential Address:</span>
              <span className="font-bold text-slate-900 text-right max-w-xs">{employee.address}</span>
            </div>
          </div>
        </div>

        {/* Employment & Shift Details */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/80">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#1d4ed8]" />
            Employment & Shift Details
          </h3>
          <div className="space-y-3 text-xs font-semibold">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Date of Joining:</span>
              <span className="font-bold text-slate-900">{employee.joiningDate}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Department:</span>
              <span className="font-bold text-slate-900">{employee.departmentName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Designation:</span>
              <span className="font-bold text-slate-900">{employee.designationName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Assigned Shift:</span>
              <span className="font-bold text-[#1d4ed8]">{employee.shiftName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Biometric PIN:</span>
              <span className="font-mono font-bold text-slate-900">{employee.biometricPin}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Portal Password:</span>
              <span className="font-mono text-slate-700">••••••••</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
