import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Holiday } from '../../types';
import { dbService } from '../../services/dbService';

export const HolidayManager: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>(() => dbService.getHolidays());
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<Holiday['type']>('Company Festival');
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsub = dbService.subscribe(() => {
      setHolidays(dbService.getHolidays());
    });
    return () => unsub();
  }, []);

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !date) {
      setErrorMsg('Please enter both holiday name and date.');
      return;
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    const newHoliday: Holiday = {
      id: `hol-${Date.now()}`,
      name: name.trim(),
      date,
      dayOfWeek,
      type,
      description: description.trim() || undefined
    };

    dbService.saveHoliday(newHoliday);
    setName('');
    setDate('');
    setDescription('');
    setShowAddModal(false);
    setSuccessMsg(`Holiday "${newHoliday.name}" added successfully and published to employees.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteHoliday = (holiday: Holiday) => {
    if (confirm(`Are you sure you want to delete "${holiday.name}" from the company holiday calendar?`)) {
      dbService.deleteHoliday(holiday.id);
      setSuccessMsg(`Holiday "${holiday.name}" has been removed.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Sort holidays by date
  const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-2xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>HR Administration • Calendar Management</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Company Holiday Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure official company holidays, festival days, and national off days. All updates reflect instantly on employee dashboards.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Holiday</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Holiday Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedHolidays.map((holiday) => {
          const holidayDate = new Date(holiday.date);
          const isUpcoming = holidayDate.getTime() >= new Date().setHours(0, 0, 0, 0);

          return (
            <div
              key={holiday.id}
              className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      holiday.type === 'National'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : holiday.type === 'Company Festival'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {holiday.type}
                  </span>

                  <button
                    onClick={() => handleDeleteHoliday(holiday)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {holiday.name}
                </h3>
                {holiday.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {holiday.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{holiday.date}</span>
                </div>
                <span className="font-bold text-slate-800">
                  {holiday.dayOfWeek}
                </span>
              </div>
            </div>
          );
        })}

        {sortedHolidays.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Holidays Scheduled</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click &quot;Add New Holiday&quot; above to declare festival holidays or official non-working company dates.
            </p>
          </div>
        )}
      </div>

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Add Company Holiday</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddHoliday} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Holiday / Festival Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Gandhi Jayanti, Diwali, Annual Day"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-normal text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Holiday Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-normal text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Holiday Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as Holiday['type'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-normal text-sm bg-white"
                  >
                    <option value="Company Festival">Company Festival</option>
                    <option value="National">National Holiday</option>
                    <option value="Regional">Regional Off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description / Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional information for employees regarding this holiday"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-normal text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
