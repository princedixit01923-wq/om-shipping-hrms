import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, User } from 'lucide-react';
import { Announcement } from '../../types';
import { dbService } from '../../services/dbService';

export const AnnouncementsView: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    setAnnouncements(dbService.getAnnouncements());
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900">Company Announcements & Notices</h1>
        <p className="text-xs text-slate-500 mt-1">Stay updated with official corporate announcements, events, and circulars</p>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="font-extrabold text-sm text-[#0f4c81] flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#0055a5]" />
                {a.title}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
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
    </div>
  );
};
