import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Moon, Sun, Edit, Trash2 } from 'lucide-react';
import { Shift } from '../../types';
import { dbService } from '../../services/dbService';

export const ShiftManager: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('18:30');
  const [gracePeriodMins, setGracePeriodMins] = useState(15);
  const [breakDurationMins, setBreakDurationMins] = useState(60);
  const [isOvernight, setIsOvernight] = useState(false);

  const reloadData = () => {
    setShifts(dbService.getShifts());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const handleOpenModal = (shift?: Shift) => {
    if (shift) {
      setEditingShift(shift);
      setName(shift.name);
      setStartTime(shift.startTime);
      setEndTime(shift.endTime);
      setGracePeriodMins(shift.gracePeriodMins);
      setBreakDurationMins(shift.breakDurationMins);
      setIsOvernight(shift.isOvernight);
    } else {
      setEditingShift(null);
      setName('');
      setStartTime('09:30');
      setEndTime('18:30');
      setGracePeriodMins(15);
      setBreakDurationMins(60);
      setIsOvernight(false);
    }
    setShowModal(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const shiftData: Shift = {
      id: editingShift ? editingShift.id : `sh-${Date.now()}`,
      name,
      startTime,
      endTime,
      gracePeriodMins: Number(gracePeriodMins),
      breakDurationMins: Number(breakDurationMins),
      workingHours: 8.5,
      weeklyOff: ['Sunday'],
      isOvernight
    };

    dbService.saveShift(shiftData);
    setShowModal(false);
    reloadData();
  };

  const handleDeleteShift = (s: Shift) => {
    if (window.confirm(`Are you sure you want to delete shift "${s.name}"?`)) {
      dbService.deleteShift(s.id);
      reloadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-3d bg-white p-6 rounded-3xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" /> Shift Schedule Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure morning, evening, and overnight shifts with edit and delete capabilities</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="btn-3d-primary flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Shift
        </button>
      </div>

      {/* Shift List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map((s) => (
          <div key={s.id} className="card-3d bg-white rounded-3xl p-6 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-extrabold text-sm text-slate-900">{s.name}</span>
                {s.isOvernight ? (
                  <span className="badge-3d flex items-center gap-1 text-[10px] font-extrabold px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-purple-500/20">
                    <Moon className="w-3 h-3 text-white" /> Overnight Shift
                  </span>
                ) : (
                  <span className="badge-3d flex items-center gap-1 text-[10px] font-extrabold px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-500/20">
                    <Sun className="w-3 h-3 text-white" /> Day Shift
                  </span>
                )}
              </div>

              <div className="py-4 space-y-2.5 text-xs font-semibold text-slate-600">
                <div className="flex justify-between items-center bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
                  <span className="text-slate-500 font-bold">Shift Timings:</span>
                  <span className="font-black text-blue-600 text-sm">{s.startTime} → {s.endTime}</span>
                </div>
                <div className="flex justify-between px-1">
                  <span>Grace Period:</span>
                  <span className="font-bold text-slate-800">{s.gracePeriodMins} Mins</span>
                </div>
                <div className="flex justify-between px-1">
                  <span>Break Duration:</span>
                  <span className="font-bold text-slate-800">{s.breakDurationMins} Mins</span>
                </div>
                <div className="flex justify-between px-1">
                  <span>Weekly Off:</span>
                  <span className="font-bold text-slate-800">{s.weeklyOff.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Actions: Edit & Delete */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenModal(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-xl transition-all shadow-2xs hover:shadow-xs active:translate-y-0.5"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Shift
              </button>
              <button
                onClick={() => handleDeleteShift(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-all shadow-2xs hover:shadow-xs active:translate-y-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-1">
              {editingShift ? 'Edit Shift Policy' : 'Create Shift Policy'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Define shift timings, grace period, and midnight transition parameters</p>

            <form onSubmit={handleSaveShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shift Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shift A (12:30:00 to 20:00:00)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grace Period (Mins)</label>
                  <input
                    type="number"
                    required
                    value={gracePeriodMins}
                    onChange={(e) => setGracePeriodMins(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Break Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    value={breakDurationMins}
                    onChange={(e) => setBreakDurationMins(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="overnightCheck"
                  checked={isOvernight}
                  onChange={(e) => setIsOvernight(e.target.checked)}
                  className="rounded border-slate-300 text-[#1d4ed8]"
                />
                <label htmlFor="overnightCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  This is an Overnight Shift crossing Midnight (e.g. 8:00 PM → 5:30 AM)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#1d4ed8] hover:bg-[#0a192f] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {editingShift ? 'Update Shift' : 'Save Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
