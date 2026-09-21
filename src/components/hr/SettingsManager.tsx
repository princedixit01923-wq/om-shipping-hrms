import React, { useState } from 'react';
import { Settings, MapPin, Building, Save, CheckCircle2 } from 'lucide-react';
import { CompanySettings, OfficeLocation } from '../../types';
import { dbService } from '../../services/dbService';

interface SettingsManagerProps {
  settings: CompanySettings;
  officeLocation: OfficeLocation;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ settings: initialSettings, officeLocation: initialOffice }) => {
  const [settings, setSettings] = useState<CompanySettings>(initialSettings);
  const [office] = useState<OfficeLocation>(initialOffice);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.updateSettings(settings);
    dbService.updateOfficeLocation(office);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#1d4ed8]" /> System & HR Policy Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure company profile, branding & attendance policy parameters</p>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> System settings saved successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/80">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#0a192f]" /> Company Identity & Branding
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#1d4ed8]"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#1d4ed8]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-700 mb-1">Corporate Office Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#1d4ed8]"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#1d4ed8]"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#1d4ed8]"
              />
            </div>
          </div>
        </div>

        {/* GPS Location & Attendance Policy */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/80">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" /> GPS Location & Shift Attendance Parameters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 mb-1">Grace Period (Minutes)</label>
              <input
                type="number"
                value={settings.gracePeriodMinutes}
                onChange={(e) => setSettings({ ...settings, gracePeriodMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#1d4ed8]"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Late Mark Threshold (Minutes)</label>
              <input
                type="number"
                value={settings.lateMarkAfterMinutes}
                onChange={(e) => setSettings({ ...settings, lateMarkAfterMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#1d4ed8]"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs font-bold text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireLocationForPunch}
                onChange={(e) => setSettings({ ...settings, requireLocationForPunch: e.target.checked })}
                className="rounded border-slate-300 text-[#1d4ed8]"
              />
              Require Verified GPS Geolocation Capture for All Attendance Punches
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auditLoggingEnabled}
                onChange={(e) => setSettings({ ...settings, auditLoggingEnabled: e.target.checked })}
                className="rounded border-slate-300 text-[#1d4ed8]"
              />
              Enable Immutable Security Audit Logging
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3.5 bg-[#0a192f] hover:bg-[#1d4ed8] text-white text-xs font-black rounded-2xl shadow-lg transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save HR Settings
          </button>
        </div>
      </form>
    </div>
  );
};
