import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, MessageCircle, Send, X, Users, PhoneCall } from 'lucide-react';
import { Announcement, Employee } from '../../types';
import { dbService } from '../../services/dbService';

const DEFAULT_HR_WHATSAPP = '+91 7984900548';

export const AnnouncementManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Announcement['priority']>('High');
  const [sendWhatsAppOnPublish, setSendWhatsAppOnPublish] = useState(true);
  const [selectedMobileForPublish, setSelectedMobileForPublish] = useState(DEFAULT_HR_WHATSAPP);

  // WhatsApp Modal state
  const [targetRecipient, setTargetRecipient] = useState<'default_group' | 'employee' | 'custom'>('default_group');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [customMobile, setCustomMobile] = useState('');

  const reloadData = () => {
    setAnnouncements(dbService.getAnnouncements());
    setEmployees(dbService.getEmployees());
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const formatWhatsAppText = (a: Announcement) => {
    const dateStr = new Date(a.publishedAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return `📢 *OM SAFETY SERVICES LLP*
*OFFICIAL CORPORATE ANNOUNCEMENT*
----------------------------------------
📌 *Title:* ${a.title}
⚡ *Priority:* ${a.priority.toUpperCase()}
📅 *Date:* ${dateStr}

📝 ${a.description}

----------------------------------------
_Published by ${a.publishedBy || 'HR Administration'}_
_OM Safety Services LLP HRMS Portal_`;
  };

  const openWhatsApp = (a: Announcement, mobileNumber?: string) => {
    const text = formatWhatsAppText(a);
    const encodedText = encodeURIComponent(text);
    const targetNum = mobileNumber || DEFAULT_HR_WHATSAPP;

    let cleanNumber = targetNum.replace(/[^0-9]/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }
    window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}`, '_blank');
  };

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

    if (sendWhatsAppOnPublish) {
      if (selectedMobileForPublish === DEFAULT_HR_WHATSAPP) {
        openWhatsApp(newAnc, DEFAULT_HR_WHATSAPP);
      } else {
        const emp = employees.find((e) => e.id === selectedMobileForPublish || e.employeeId === selectedMobileForPublish);
        openWhatsApp(newAnc, emp?.mobile || DEFAULT_HR_WHATSAPP);
      }
    }

    setTitle('');
    setDescription('');
    setSendWhatsAppOnPublish(true);
    setSelectedMobileForPublish(DEFAULT_HR_WHATSAPP);
  };

  const handleOpenWhatsAppModal = (a: Announcement) => {
    setSelectedAnnouncement(a);
    setTargetRecipient('default_group');
    setSelectedEmployeeId(employees[0]?.id || '');
    setCustomMobile('');
    setShowWhatsAppModal(true);
  };

  const handleConfirmWhatsAppSend = () => {
    if (!selectedAnnouncement) return;

    if (targetRecipient === 'default_group') {
      openWhatsApp(selectedAnnouncement, DEFAULT_HR_WHATSAPP);
    } else if (targetRecipient === 'employee') {
      const emp = employees.find((e) => e.id === selectedEmployeeId || e.employeeId === selectedEmployeeId);
      openWhatsApp(selectedAnnouncement, emp?.mobile || DEFAULT_HR_WHATSAPP);
    } else if (targetRecipient === 'custom') {
      openWhatsApp(selectedAnnouncement, customMobile || DEFAULT_HR_WHATSAPP);
    }
    setShowWhatsAppModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" /> Corporate Announcements & WhatsApp Alert Broadcast
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast official circulars to HRMS Portal & Instant WhatsApp alerts via <strong className="text-emerald-700">{DEFAULT_HR_WHATSAPP}</strong>
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Publish Announcement
        </button>
      </div>

      {/* Announcement List Cards */}
      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900">{a.title}</span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    a.priority === 'Urgent' || a.priority === 'High'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : a.priority === 'Medium'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {a.priority} Priority
                </span>
              </div>

              {/* Instant WhatsApp Action Button */}
              <button
                onClick={() => handleOpenWhatsAppModal(a)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all shadow-2xs hover:shadow-xs active:translate-y-0.5 self-start sm:self-auto cursor-pointer"
                title={`Send WhatsApp Alert to ${DEFAULT_HR_WHATSAPP} or Employees`}
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Send WhatsApp Alert ({DEFAULT_HR_WHATSAPP})</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{a.description}</p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100 font-semibold">
              <span>Published by: <strong className="text-slate-700">{a.publishedBy}</strong></span>
              <span>{new Date(a.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Announcements Published</h3>
            <p className="text-xs text-slate-400 mt-1">Click "Publish Announcement" above to post company updates and send WhatsApp notifications.</p>
          </div>
        )}
      </div>

      {/* --- PUBLISH ANNOUNCEMENT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">New Corporate Announcement</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Port Logistics Operational Briefing"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white transition-all"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Content Details *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide complete notice details for staff..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* WhatsApp Broadcast Option */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-emerald-900">
                  <input
                    type="checkbox"
                    checked={sendWhatsAppOnPublish}
                    onChange={(e) => setSendWhatsAppOnPublish(e.target.checked)}
                    className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                  />
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Send WhatsApp Alert Immediately</span>
                </label>

                {sendWhatsAppOnPublish && (
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">WhatsApp Target Number:</label>
                    <select
                      value={selectedMobileForPublish}
                      onChange={(e) => setSelectedMobileForPublish(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-semibold text-slate-900"
                    >
                      <option value={DEFAULT_HR_WHATSAPP}>📢 Primary Broadcast Number ({DEFAULT_HR_WHATSAPP})</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          📱 {emp.fullName} ({emp.mobile || 'No phone'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- WHATSAPP BROADCAST MODAL --- */}
      {showWhatsAppModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Send WhatsApp Alert</h3>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 font-mono text-[11px] text-slate-800 space-y-1 max-h-40 overflow-y-auto">
              <div className="font-bold text-emerald-800">Message Preview:</div>
              <div className="whitespace-pre-line text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                {formatWhatsAppText(selectedAnnouncement)}
              </div>
            </div>

            {/* Recipient Selection */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-800">Select Target WhatsApp Number:</label>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setTargetRecipient('default_group')}
                  className={`w-full p-3 rounded-2xl text-xs font-extrabold border flex items-center justify-between transition-all ${
                    targetRecipient === 'default_group'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Primary HR WhatsApp Number</span>
                  </div>
                  <span className="font-mono text-emerald-700">{DEFAULT_HR_WHATSAPP}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetRecipient('employee')}
                  className={`w-full p-3 rounded-2xl text-xs font-extrabold border flex items-center justify-between transition-all ${
                    targetRecipient === 'employee'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                    <span>Send to Registered Staff Member</span>
                  </div>
                </button>
              </div>

              {targetRecipient === 'employee' && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee:</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.mobile || 'No Mobile Registered'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWhatsAppSend}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>Open WhatsApp & Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
