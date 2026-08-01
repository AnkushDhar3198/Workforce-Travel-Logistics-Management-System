import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Sparkles, Menu, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeTab: string;
  notifications: any[];
  loadNotifications: () => void;
  onOpenMobileMenu?: () => void;
  sosStatus?: string;
  triggerSOS?: () => void;
}

const TAB_LABELS: Record<string, { label: string; emoji: string }> = {
  itinerary: { label: 'My Itinerary', emoji: '🗺️' },
  requisition: { label: 'Travel Request', emoji: '✈️' },
  'expenses-employee': { label: 'Expense Report', emoji: '💳' },
  'docs-employee': { label: 'Travel Documents', emoji: '📄' },
  approvals: { label: 'Pending Approvals', emoji: '📋' },
  vendors: { label: 'Preferred Vendors', emoji: '🏢' },
  policy: { label: 'Policy Engine', emoji: '🛡️' },
  'expenses-finance': { label: 'Expense Auditing', emoji: '💰' },
  logistics: { label: 'Logistics Pipeline', emoji: '📦' },
  security: { label: 'Duty of Care Map', emoji: '🔐' },
  analytics: { label: 'Reports & ROI', emoji: '📊' },
  audit: { label: 'System Audit Logs', emoji: '🔎' },
  users: { label: 'User Directory', emoji: '👥' },
};

export default function Header({ activeTab, notifications, loadNotifications, onOpenMobileMenu, sosStatus, triggerSOS }: HeaderProps) {
  const { user, authFetch, logout } = useAuth();
  const { themeData } = useTheme();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.readStatus).length;
  const tabInfo = TAB_LABELS[activeTab] || { label: activeTab.replace('-', ' '), emoji: '📌' };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await authFetch(`${API_BASE}/notifications/read-all`, { method: 'PUT' });
      loadNotifications();
    } catch {}
  };

  return (
    <header
      className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 md:px-6"
      style={{
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      }}
    >
      {/* Tab title & Mobile Menu Toggle */}
      <div className="flex items-center gap-2.5 animate-fade-slide-in">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0"
            style={{
              background: 'var(--nav-hover-bg)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <span className="text-xl">{tabInfo.emoji}</span>
        <h1
          className="text-sm md:text-base font-bold capitalize tracking-tight truncate max-w-[180px] sm:max-w-none"
          style={{ color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}
        >
          {tabInfo.label}
        </h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Theme badge */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: 'var(--nav-hover-bg)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          <span>{themeData.emoji}</span>
          <span>{themeData.name}</span>
        </div>

        {/* Emergency SOS Button for Traveling Employees */}
        {user?.role === 'TRAVELING_EMPLOYEE' && triggerSOS && (
          <button
            onClick={triggerSOS}
            title="Trigger Emergency SOS"
            className="px-2.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            style={{
              background: sosStatus === 'triggered' ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#f87171',
              animation: sosStatus === 'triggered' ? 'sos-pulse 1.2s infinite' : undefined,
            }}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{sosStatus === 'triggered' ? 'SOS ACTIVE' : 'SOS'}</span>
          </button>
        )}

        {/* Smartphone-only Sign Out Button */}
        <button
          onClick={logout}
          title="Sign Out"
          className="md:hidden px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
          style={{
            background: 'var(--nav-hover-bg)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>

        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowNotifPanel(v => !v)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all"
            style={{
              background: showNotifPanel ? 'var(--nav-active-bg)' : 'var(--nav-hover-bg)',
              border: `1px solid ${showNotifPanel ? 'var(--border-active)' : 'var(--border-subtle)'}`,
              color: 'var(--text-secondary)',
            }}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] rounded-full flex items-center justify-center text-[9px] font-black animate-badge-pop px-1"
                style={{
                  background: 'var(--accent-primary)',
                  color: 'var(--btn-primary-text)',
                  boxShadow: '0 0 8px var(--accent-glow-strong)',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification panel */}
          {showNotifPanel && (
            <div
              className="absolute right-0 top-12 w-80 rounded-2xl animate-scale-in overflow-hidden"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle)',
                zIndex: 50,
              }}
            >
              {/* Panel header */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--nav-active-bg)', color: 'var(--accent-primary)' }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark all</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifPanel(false)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                    style={{ color: 'var(--text-muted)', background: 'var(--nav-hover-bg)' }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 flex flex-col items-center gap-2">
                    <Sparkles className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>All caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className="px-4 py-3 transition-colors"
                        style={{
                          background: n.readStatus ? 'transparent' : 'var(--nav-active-bg)',
                          opacity: n.readStatus ? 0.6 : 1,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: 'var(--accent-primary)' }}
                          >
                            {n.type}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {n.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
