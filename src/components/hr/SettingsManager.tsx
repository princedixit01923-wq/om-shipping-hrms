import React, { useState, useEffect } from 'react';
import { Settings, Shield, MapPin, Building, Save, CheckCircle2, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { CompanySettings, OfficeLocation } from '../../types';
import { dbService } from '../../services/dbService';
import { getActiveSupabaseConfig, saveSupabaseConfig, checkSupabaseHealth } from '../../services/supabaseClient';

interface SettingsManagerProps {
  settings: CompanySettings;
  officeLocation: OfficeLocation;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ settings: initialSettings, officeLocation: initialOffice }) => {
  const [settings, setSettings] = useState<CompanySettings>(initialSettings);
  const [office, setOffice] = useState<OfficeLocation>(initialOffice);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Supabase Configuration State
  const [supabaseConfig, setSupabaseConfig] = useState(() => getActiveSupabaseConfig());
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(supabaseConfig.anonKey);
  const [cloudStatus, setCloudStatus] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: 'Testing connection...'
  });
  const [syncingCloud, setSyncingCloud] = useState(false);

  const testCloud = async () => {
    setSyncingCloud(true);
    const health = await checkSupabaseHealth();
    setCloudStatus(health);
    if (health.connected) {
      await dbService.syncFromSupabase();
    }
    setSyncingCloud(false);
  };

  useEffect(() => {
    testCloud();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.updateSettings(settings);
    dbService.updateOfficeLocation(office);
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setSavedSuccess(true);
    testCloud();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#1d4ed8]" /> System & HR Policy Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure company profile, attendance parameters & Supabase database sync</p>
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
          </div>
        </div>

        {/* Database & Cloud Synchronization (Supabase) */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" /> Supabase Database & Multi-Device Cloud Sync
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  cloudStatus.connected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cloudStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                {cloudStatus.connected ? 'Cloud Connected' : 'Local Offline Fallback'}
              </span>
              <button
                type="button"
                onClick={testCloud}
                disabled={syncingCloud}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Test and Re-sync with Cloud Database"
              >
                <RefreshCw className={`w-4 h-4 ${syncingCloud ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Ensures that employees added on mobile phones immediately synchronize and display on laptops and all authorized devices.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 mb-1">Supabase Project URL</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:ring-2 focus:ring-[#1d4ed8]"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1">Supabase Anon Public API Key</label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOi..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:ring-2 focus:ring-[#1d4ed8]"
              />
            </div>
          </div>

          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{cloudStatus.message}</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                saveSupabaseConfig(supabaseUrl, supabaseKey);
                await testCloud();
                alert(cloudStatus.connected ? 'Cloud synchronization successful!' : 'Could not reach Supabase. Data is currently safely cached in local storage.');
              }}
              className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              Sync Now
            </button>
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
