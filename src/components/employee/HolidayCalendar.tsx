import React, { useState, useEffect } from 'react';
import { CalendarDays, Star, PartyPopper } from 'lucide-react';
import { Holiday } from '../../types';
import { dbService } from '../../services/dbService';

export const HolidayCalendar: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    setHolidays(dbService.getHolidays());
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900">Company Holiday Calendar 2026</h1>
        <p className="text-xs text-slate-500 mt-1">Official holidays recognized across all shipping and administrative branches</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {holidays.map((h) => (
          <div key={h.id} className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-[#0f4c81] rounded-2xl text-center min-w-[64px]">
              <span className="text-xs font-black uppercase block">{new Date(h.date).toLocaleString('default', { month: 'short' })}</span>
              <span className="text-2xl font-black block mt-0.5">{new Date(h.date).getDate()}</span>
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 inline-block mb-1">
                {h.type}
              </span>
              <h3 className="font-extrabold text-sm text-slate-900">{h.name}</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{h.dayOfWeek}</p>
              {h.description && <p className="text-xs text-slate-600 mt-2">{h.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
