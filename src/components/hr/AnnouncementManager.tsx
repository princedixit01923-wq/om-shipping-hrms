import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  MessageCircle,
  Send,
  X,
  Users,
  PhoneCall,
  Trash2,
  CheckSquare,
  Square,
  Search,
  Check,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { Announcement, Employee } from '../../types';
import { dbService } from '../../services/dbService';

const DEFAULT_HR_WHATSAPP = '+91 7984900548';

export const AnnouncementManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Form states for New Announcement
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Announcement['priority']>('High');
  const [sendWhatsAppOnPublish, setSendWhatsAppOnPublish] = useState(true);
  const [publishTargetMode, setPublishTargetMode] = useState<'all' | 'multiple' | 'hr_primary'>('all');
  const [publishSelectedEmpIds, setPublishSelectedEmpIds] = useState<string[]>([]);
  const [publishSearchQuery, setPublishSearchQuery] = useState('');

  // WhatsApp Alert Modal states
  const [modalTargetMode, setModalTargetMode] = useState<'all' | 'multiple' | 'single' | 'hr_primary'>('all');
  const [modalSelectedEmpIds, setModalSelectedEmpIds] = useState<string[]>([]);
  const [modalSingleEmpId, setModalSingleEmpId] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [sentEmpIds, setSentEmpIds] = useState<Set<string>>(new Set());

  const reloadData = () => {
    setAnnouncements(dbService.getAnnouncements());
    const empList = dbService.getEmployees();
    setEmployees(empList);
  };

  useEffect(() => {
    reloadData();
    const unsub = dbService.subscribe(reloadData);
    return () => unsub();
  }, []);

  // Initialize selected employee IDs when employee list loads
  useEffect(() => {
    if (employees.length > 0) {
      if (publishSelectedEmpIds.length === 0) {
        setPublishSelectedEmpIds(employees.map((e) => e.id));
      }
      if (modalSelectedEmpIds.length === 0) {
        setModalSelectedEmpIds(employees.map((e) => e.id));
      }
      if (!modalSingleEmpId) {
        setModalSingleEmpId(employees[0]?.id || '');
      }
    }
  }, [employees]);

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

  const getCleanPhoneNumber = (phoneStr?: string): string => {
    if (!phoneStr) return '';
    let clean = phoneStr.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      clean = `91${clean}`;
    }
    return clean;
  };

  const openWhatsApp = (a: Announcement, mobileNumber: string, empId?: string) => {
    const text = formatWhatsAppText(a);
    const encodedText = encodeURIComponent(text);
    const cleanNumber = getCleanPhoneNumber(mobileNumber);
    if (!cleanNumber) {
      alert('Mobile number is missing or invalid.');
      return;
    }
    window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}`, '_blank');
    if (empId) {
      setSentEmpIds((prev) => new Set(prev).add(empId));
    }
  };

  // Select / Deselect All for Publish Modal
  const handleToggleSelectAllPublish = () => {
    if (publishSelectedEmpIds.length === employees.length) {
      setPublishSelectedEmpIds([]);
    } else {
      setPublishSelectedEmpIds(employees.map((e) => e.id));
    }
  };

  const handleToggleEmpPublish = (id: string) => {
    setPublishSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select / Deselect All for WhatsApp Modal
  const handleToggleSelectAllModal = () => {
    if (modalSelectedEmpIds.length === employees.length) {
      setModalSelectedEmpIds([]);
    } else {
      setModalSelectedEmpIds(employees.map((e) => e.id));
    }
  };

  const handleToggleEmpModal = (id: string) => {
    setModalSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newAnc: Announcement = {
      id: `anc-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      priority,
      targetAudience: 'All Employees',
      publishedBy: 'HR Administrator',
      publishedAt: new Date().toISOString()
    };

    dbService.addAnnouncement(newAnc);
    setShowModal(false);

    if (sendWhatsAppOnPublish) {
      if (publishTargetMode === 'hr_primary') {
        openWhatsApp(newAnc, DEFAULT_HR_WHATSAPP);
      } else {
        // Open WhatsApp Modal for multi-recipient broadcast
        setSelectedAnnouncement(newAnc);
        if (publishTargetMode === 'all') {
          setModalTargetMode('all');
          setModalSelectedEmpIds(employees.map((emp) => emp.id));
        } else {
          setModalTargetMode('multiple');
          setModalSelectedEmpIds(publishSelectedEmpIds);
        }
        setSentEmpIds(new Set());
        setShowWhatsAppModal(true);
      }
    }

    setTitle('');
    setDescription('');
    setSendWhatsAppOnPublish(true);
  };

  const handleOpenWhatsAppModal = (a: Announcement) => {
    setSelectedAnnouncement(a);
    setModalTargetMode('all');
    setModalSelectedEmpIds(employees.map((emp) => emp.id));
    setModalSearchQuery('');
    setSentEmpIds(new Set());
    setShowWhatsAppModal(true);
  };

  const handleDeleteAnnouncement = (a: Announcement) => {
    if (confirm(`Are you sure you want to delete announcement "${a.title}"?`)) {
      dbService.deleteAnnouncement(a.id);
    }
  };

  // Filtered employees for modals
  const filteredPublishEmployees = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(publishSearchQuery.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(publishSearchQuery.toLowerCase()) ||
      e.departmentName.toLowerCase().includes(publishSearchQuery.toLowerCase()) ||
      e.mobile.includes(publishSearchQuery)
  );

  const filteredModalEmployees = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      e.departmentName.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      e.mobile.includes(modalSearchQuery)
  );

  // Get target recipients list for WhatsApp Modal
  const getModalTargetEmployees = (): Employee[] => {
    if (modalTargetMode === 'all') {
      return employees;
    }
    if (modalTargetMode === 'multiple') {
      return employees.filter((e) => modalSelectedEmpIds.includes(e.id));
    }
    if (modalTargetMode === 'single') {
      const single = employees.find((e) => e.id === modalSingleEmpId || e.employeeId === modalSingleEmpId);
      return single ? [single] : [];
    }
    return [];
  };

  const modalTargetEmps = getModalTargetEmployees();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" /> Corporate Announcements & Multi-Recipient WhatsApp Alert Broadcast
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish circulars to HRMS Portal & broadcast instant WhatsApp alerts to <strong className="text-emerald-700">All Employees</strong> or selected staff.
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

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* Instant WhatsApp Action Button */}
                <button
                  onClick={() => handleOpenWhatsAppModal(a)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all shadow-2xs hover:shadow-xs active:translate-y-0.5 cursor-pointer"
                  title="Send WhatsApp Alert to Employees or Select All"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Send WhatsApp Alert</span>
                </button>

                {/* Delete Announcement Button */}
                <button
                  onClick={() => handleDeleteAnnouncement(a)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 transition-all shadow-2xs hover:shadow-xs active:translate-y-0.5 cursor-pointer"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Delete</span>
                </button>
              </div>
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
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">New Corporate Announcement</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
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
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl space-y-3">
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
                  <div className="space-y-3 pt-1">
                    <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                      Select WhatsApp Recipients:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPublishTargetMode('all')}
                        className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          publishTargetMode === 'all'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-emerald-200 text-emerald-900 hover:bg-emerald-100/50'
                        }`}
                      >
                        <Users className="w-4 h-4 mb-1" />
                        <span>Select All ({employees.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPublishTargetMode('multiple')}
                        className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          publishTargetMode === 'multiple'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-emerald-200 text-emerald-900 hover:bg-emerald-100/50'
                        }`}
                      >
                        <CheckSquare className="w-4 h-4 mb-1" />
                        <span>Select Multiple ({publishSelectedEmpIds.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPublishTargetMode('hr_primary')}
                        className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          publishTargetMode === 'hr_primary'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-emerald-200 text-emerald-900 hover:bg-emerald-100/50'
                        }`}
                      >
                        <PhoneCall className="w-4 h-4 mb-1" />
                        <span>HR Primary</span>
                      </button>
                    </div>

                    {/* Multi-Select Employee List for Publish */}
                    {publishTargetMode === 'multiple' && (
                      <div className="bg-white border border-emerald-200 rounded-2xl p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              placeholder="Search employee by name, ID or phone..."
                              value={publishSearchQuery}
                              onChange={(e) => setPublishSearchQuery(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleToggleSelectAllPublish}
                            className="text-xs font-extrabold px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl transition-colors cursor-pointer shrink-0"
                          >
                            {publishSelectedEmpIds.length === employees.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                          {filteredPublishEmployees.map((emp) => {
                            const isChecked = publishSelectedEmpIds.includes(emp.id);
                            return (
                              <label
                                key={emp.id}
                                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-emerald-50/90 border-emerald-300 text-slate-900 font-bold'
                                    : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleEmpPublish(emp.id)}
                                    className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <div>
                                    <span className="font-bold text-slate-900">{emp.fullName}</span>
                                    <span className="text-[10px] text-slate-500 ml-1.5">({emp.employeeId})</span>
                                  </div>
                                </div>
                                <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                                  {emp.mobile || 'No Mobile'}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
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

      {/* --- WHATSAPP BROADCAST DISPATCHER MODAL --- */}
      {showWhatsAppModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                <h3 className="text-base font-black text-slate-900">WhatsApp Alert Broadcast Dispatcher</h3>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Announcement Message Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 font-mono text-[11px] text-slate-800 space-y-1 max-h-36 overflow-y-auto">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Broadcast Message Preview:</span>
              </div>
              <div className="whitespace-pre-line text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs leading-relaxed">
                {formatWhatsAppText(selectedAnnouncement)}
              </div>
            </div>

            {/* Target Mode Selector */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-800">Select Target WhatsApp Audience:</label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalTargetMode('all');
                    setModalSelectedEmpIds(employees.map((e) => e.id));
                  }}
                  className={`p-3 rounded-2xl text-xs font-extrabold border flex items-center justify-between transition-all cursor-pointer ${
                    modalTargetMode === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Select All Staff</span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20">
                    {employees.length} Staff
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTargetMode('multiple')}
                  className={`p-3 rounded-2xl text-xs font-extrabold border flex items-center justify-between transition-all cursor-pointer ${
                    modalTargetMode === 'multiple'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    <span>Select Multiple</span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20">
                    {modalSelectedEmpIds.length} Selected
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTargetMode('single')}
                  className={`p-3 rounded-2xl text-xs font-extrabold border flex items-center justify-between transition-all cursor-pointer ${
                    modalTargetMode === 'single'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4" />
                    <span>Single Staff</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTargetMode('hr_primary')}
                  className={`p-3 rounded-2xl text-xs font-extrabold border flex items-center justify-between transition-all cursor-pointer ${
                    modalTargetMode === 'hr_primary'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    <span>HR Primary</span>
                  </div>
                  <span className="text-[10px] font-mono">{DEFAULT_HR_WHATSAPP}</span>
                </button>
              </div>

              {/* Single Employee Selection */}
              {modalTargetMode === 'single' && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-700">Choose Employee:</label>
                  <select
                    value={modalSingleEmpId}
                    onChange={(e) => setModalSingleEmpId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.mobile || 'No Phone Registered'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Multi-Select Employee List for WhatsApp Modal */}
              {modalTargetMode === 'multiple' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search employee by name, code, dept..."
                        value={modalSearchQuery}
                        onChange={(e) => setModalSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleSelectAllModal}
                      className="text-xs font-extrabold px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      {modalSelectedEmpIds.length === employees.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                    {filteredModalEmployees.map((emp) => {
                      const isChecked = modalSelectedEmpIds.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-300 text-slate-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleEmpModal(emp.id)}
                              className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <span className="font-bold text-slate-900">{emp.fullName}</span>
                              <span className="text-[10px] text-slate-500 ml-1.5">({emp.departmentName})</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-700 font-bold">
                            {emp.mobile || 'No Mobile'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Broadcast Dispatcher Queue for All / Multiple Selected Employees */}
              {(modalTargetMode === 'all' || modalTargetMode === 'multiple') && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Selected Dispatch Recipients ({modalTargetEmps.length} Staff):</span>
                    </span>
                    <span className="text-emerald-700">
                      {sentEmpIds.size} / {modalTargetEmps.length} Sent
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {modalTargetEmps.map((emp) => {
                      const isSent = sentEmpIds.has(emp.id);
                      return (
                        <div
                          key={emp.id}
                          className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                            isSent
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{emp.fullName}</span>
                              <span className="text-[10px] font-normal text-slate-500">({emp.employeeId})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">📱 {emp.mobile || 'No Mobile'}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openWhatsApp(selectedAnnouncement, emp.mobile, emp.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                              isSent
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isSent ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Sent ✓</span>
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Send WhatsApp</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}

                    {modalTargetEmps.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                        No employees selected. Please select all or check specific employees above.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>

              {modalTargetMode === 'hr_primary' && (
                <button
                  type="button"
                  onClick={() => openWhatsApp(selectedAnnouncement, DEFAULT_HR_WHATSAPP)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                  <span>Open WhatsApp ({DEFAULT_HR_WHATSAPP})</span>
                </button>
              )}

              {modalTargetMode === 'single' && (
                <button
                  type="button"
                  onClick={() => {
                    const emp = employees.find((e) => e.id === modalSingleEmpId || e.employeeId === modalSingleEmpId);
                    if (emp) openWhatsApp(selectedAnnouncement, emp.mobile, emp.id);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                  <span>Send to Selected Employee</span>
                </button>
              )}

              {(modalTargetMode === 'all' || modalTargetMode === 'multiple') && modalTargetEmps.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    // Open WhatsApp for the first unsent employee in the list
                    const firstUnsent = modalTargetEmps.find((e) => !sentEmpIds.has(e.id)) || modalTargetEmps[0];
                    if (firstUnsent) {
                      openWhatsApp(selectedAnnouncement, firstUnsent.mobile, firstUnsent.id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                  <span>Start WhatsApp Dispatch ({modalTargetEmps.length} Staff)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
