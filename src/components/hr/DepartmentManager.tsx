import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, Award } from 'lucide-react';
import { Department, Designation } from '../../types';
import { dbService } from '../../services/dbService';

export const DepartmentManager: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  const reloadData = () => {
    setDepartments(dbService.getDepartments());
    setDesignations(dbService.getDesignations());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#0f4c81]" /> Department & Designation Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">Organize company hierarchy, department heads, and designation roles</p>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-sm text-slate-900">{dept.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#0f4c81]">
                {dept.code}
              </span>
            </div>

            <div className="py-4 space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Head of Department:</span>
                <span className="font-bold text-slate-900">{dept.headName || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span>Employee Count:</span>
                <span className="font-bold text-emerald-700">{dept.employeeCount} Staff</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-2 italic">{dept.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Designations Table */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
        <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-[#0055a5]" /> Designation Hierarchy List
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                <th className="p-3">Designation Title</th>
                <th className="p-3">Department</th>
                <th className="p-3">Description</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {designations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="p-3 font-extrabold text-slate-900">{d.name}</td>
                  <td className="p-3 text-[#0f4c81] font-bold">{d.departmentName}</td>
                  <td className="p-3 text-slate-500">{d.description}</td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
