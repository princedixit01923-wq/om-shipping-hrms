import React, { useState, useEffect } from 'react';
import { Bell, LogOut, ChevronDown, Clock, MapPin, ArrowLeft } from 'lucide-react';
import { User, CompanySettings, SystemNotification } from '../../types';
import { dbService } from '../../services/dbService';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onToggleSidebarMobile: () => void;
  settings: CompanySettings;
  canGoBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onToggleSidebarMobile,
  settings,
  canGoBack,
  onBack
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) +
          ' | ' +
          now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const notifs = dbService.getAuditLogs().slice(0, 5).map((l, i) => ({
      id: `notif-${i}`,
      userId: user.id,
      title: l.action,
      message: `${l.details} by ${l.userName}`,
      type: 'System' as const,
      isRead: false,
      createdAt: l.timestamp
    }));
    setNotifications(notifs);
  }, [user.id]);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs px-4 lg:px-6 py-2.5 flex items-center justify-between">
      {/* Left: Back Button, Mobile Toggle & Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        {canGoBack && onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl transition-all border border-slate-200/90 text-xs font-bold active:scale-95 cursor-pointer shadow-2xs"
            title="Go back to previous screen"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <button
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src={settings.logoUrl || '/assets/om_logo.jpg'}
            alt="OM Safety Services LLP"
            className="h-8 sm:h-9 w-auto object-contain bg-white rounded-md p-0.5 border border-slate-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/om_logo.jpg';
            }}
          />
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 block leading-none">
              OM Safety Services LLP
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-wider block mt-0.5">
              ONCE WITH US SAFE WITH US
            </span>
          </div>
        </div>
      </div>

      {/* Center: Live Clock & GPS Tracking Status */}
      <div className="hidden md:flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentTime}</span>
        </div>
        <div className="h-3.5 w-px bg-slate-300"></div>
        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real-time GPS Attendance Active</span>
        </div>
      </div>

      {/* Right: Notifications & Sign Out */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-900">System Notifications</span>
                <span className="text-[10px] bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                  {notifications.length} New
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-medium text-slate-900 block">{n.title}</span>
                    <span className="text-xs text-slate-600 block mt-0.5">{n.message}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">{n.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clean Direct Sign Out (HR profile removed as requested in item 17.2) */}
        {user.role === 'HR Administrator' ? (
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200 active:scale-95 cursor-pointer shadow-2xs"
            title="Sign out of HR Administration"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Sign Out</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-300"
            />
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-xs font-semibold transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
