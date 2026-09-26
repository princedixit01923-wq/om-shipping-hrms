import React, { useState, useEffect } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import { Announcement } from '../../types';
import { dbService } from '../../services/dbService';

export const AnnouncementManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Announcement['priority']>('High');

  const reloadData = () => {
    setAnnouncements(dbService.getAnnouncements());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const newAnc: Announcement = {
      id: `anc-${Date.now()}`,
      title,
      description,
      priority,
      targetAudience: 'All Employees',
      publishedBy: 'HR Administrator',
      publishedAt: new Date().toISOString()
    };

    dbService.addAnnouncement(newAnc);
    setShowModal(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#0f4c81]" /> Corporate Announcement & Circular Publisher
          </h1>
          <p className="text-xs text-slate-500 mt-1">Broadcast company policy updates, townhalls, and holiday alerts</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0f4c81] hover:bg-[#0055a5] text-white text-xs font-bold rounded-xl shadow-md transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Publish Announcement
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="font-extrabold text-sm text-[#0f4c81]">{a.title}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                {a.priority} Priority
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
              <span>Published by: {a.publishedBy}</span>
              <span>{new Date(a.publishedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-1">New Announcement</h3>
            <p className="text-xs text-slate-500 mb-4">Post notice to employee dashboard</p>

            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Port Logistics Operational Briefing"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Content</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide complete notice details..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f4c81] hover:bg-[#0055a5] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
