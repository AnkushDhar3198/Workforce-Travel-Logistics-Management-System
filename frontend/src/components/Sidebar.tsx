import React, { useState, useEffect } from 'react';
import {
  Plane, Calendar, Edit3, DollarSign, FileText, UserCheck, Settings,
  ShieldCheck, Truck, Map, BarChart3, ClipboardList, Users, ShieldAlert, LogOut,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, THEMES, type ThemeId } from '../context/ThemeContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sosStatus: string;
  triggerSOS: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { id: 'itinerary', label: 'My Itinerary', icon: Calendar, roles: ['TRAVELING_EMPLOYEE'] },
  { id: 'requisition', label: 'Travel Request', icon: Edit3, roles: ['TRAVELING_EMPLOYEE'] },
  { id: 'expenses-employee', label: 'Expense Report', icon: DollarSign, roles: ['TRAVELING_EMPLOYEE'] },
  { id: 'docs-employee', label: 'Travel Documents', icon: FileText, roles: ['TRAVELING_EMPLOYEE'] },
  { id: 'approvals', label: 'Pending Approvals', icon: UserCheck, roles: ['APPROVING_MANAGER'] },
  { id: 'vendors', label: 'Preferred Vendors', icon: Settings, roles: ['CORPORATE_TRAVEL_MANAGER'] },
  { id: 'policy', label: 'Policy Engine', icon: ShieldCheck, roles: ['CORPORATE_TRAVEL_MANAGER'] },
  { id: 'expenses-finance', label: 'Expense Auditing', icon: DollarSign, roles: ['FINANCE_PROCUREMENT'] },
  { id: 'logistics', label: 'Logistics Pipeline', icon: Truck, roles: ['LOGISTICS_COORDINATOR'] },
  { id: 'security', label: 'Duty of Care Map', icon: Map, roles: ['SECURITY_RISK_OFFICER'] },
  { id: 'analytics', label: 'Reports & ROI', icon: BarChart3, roles: ['CORPORATE_TRAVEL_MANAGER', 'FINANCE_PROCUREMENT', 'APPROVING_MANAGER'] },
  { id: 'audit', label: 'Audit Logs', icon: ClipboardList, roles: ['ADMIN'] },
  { id: 'users', label: 'User Directory', icon: Users, roles: ['ADMIN'] },
];

const ROLE_LABELS: Record<string, string> = {
  TRAVELING_EMPLOYEE: 'Traveling Employee',
  APPROVING_MANAGER: 'Approving Manager',
  CORPORATE_TRAVEL_MANAGER: 'Travel Manager',
  FINANCE_PROCUREMENT: 'Finance & Procurement',
  SECURITY_RISK_OFFICER: 'Security Officer',
  LOGISTICS_COORDINATOR: 'Logistics Coordinator',
  ADMIN: 'System Administrator',
};

export default function Sidebar({ activeTab, setActiveTab, sosStatus, triggerSOS, isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user.role));
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarMarkup = (isMobileDrawer: boolean) => {
    const isEffectiveCollapsed = isMobileDrawer ? false : collapsed;

    return (
      <aside
        style={{
          width: isMobileDrawer ? '280px' : (collapsed ? '72px' : '248px'),
          transition: 'width 0.35s cubic-bezier(0.22,1,0.36,1), transform 0.35s cubic-bezier(0.22,1,0.36,1)',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          position: isMobileDrawer ? 'fixed' : 'relative',
          top: isMobileDrawer ? 0 : undefined,
          bottom: isMobileDrawer ? 0 : undefined,
          left: isMobileDrawer ? 0 : undefined,
          height: isMobileDrawer ? '100vh' : undefined,
          zIndex: isMobileDrawer ? 50 : 30,
          transform: isMobileDrawer ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)') : undefined,
          boxShadow: isMobileDrawer ? '8px 0 32px rgba(0,0,0,0.5)' : undefined,
        }}
      >
        {/* Collapse toggle (Desktop only) */}
        {!isMobileDrawer && (
          <button
            onClick={() => setCollapsed(v => !v)}
            className="absolute -right-3 top-20 z-50 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        )}

        {/* Logo Header */}
        <div
          className="flex items-center justify-between p-5 overflow-hidden"
          style={{ borderBottom: '1px solid var(--border-subtle)', minHeight: '72px' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'var(--btn-primary-bg)',
                boxShadow: '0 4px 16px var(--accent-glow)',
              }}
            >
              <Plane className="w-5 h-5" style={{ color: 'var(--btn-primary-text)' }} />
            </div>
            {!isEffectiveCollapsed && (
              <span
                className="text-gradient font-black text-sm tracking-wider truncate"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                VOYACORE
              </span>
            )}
          </div>

          {/* Close button for Mobile Drawer */}
          {isMobileDrawer && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg border border-slate-700/50 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User avatar */}
        {!isEffectiveCollapsed && (
          <div
            className="px-4 py-3 mx-3 my-2 rounded-2xl animate-fade-slide-up"
            style={{
              background: 'var(--nav-hover-bg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                style={{
                  background: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                  boxShadow: '0 0 0 2px var(--border-default), 0 0 12px var(--accent-glow)',
                }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user.name}
                </p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-accent)' }}>
                  {ROLE_LABELS[user.role] || user.role}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed avatar */}
        {isEffectiveCollapsed && (
          <div className="flex justify-center py-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
              style={{
                background: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
              }}
            >
              {initials}
            </div>
          </div>
        )}

        {/* Nav list */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                title={isEffectiveCollapsed ? item.label : undefined}
                className={`nav-item animate-fade-slide-in stagger-${Math.min(i + 1, 8)} ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isEffectiveCollapsed ? 'center' : 'flex-start' }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isEffectiveCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Theme Picker Grid */}
        <div
          className="p-3"
          style={{
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--nav-hover-bg)',
          }}
        >
          {!isEffectiveCollapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 pl-1" style={{ color: 'var(--text-muted)' }}>
              Theme
            </p>
          )}
          <div className={`grid gap-1.5 ${isEffectiveCollapsed ? 'grid-cols-1' : 'grid-cols-4'}`}>
            {themes.map(t => (
              <button
                key={t.id}
                title={t.name}
                onClick={() => setTheme(t.id as ThemeId)}
                className="rounded-lg flex items-center justify-center transition-all cursor-pointer"
                style={{
                  width: isEffectiveCollapsed ? '40px' : '100%',
                  height: isEffectiveCollapsed ? '36px' : '32px',
                  background: theme === t.id ? 'var(--nav-active-bg)' : 'transparent',
                  border: `1.5px solid ${theme === t.id ? 'var(--border-active)' : 'transparent'}`,
                  boxShadow: theme === t.id ? '0 0 10px var(--accent-glow)' : undefined,
                  fontSize: '1rem',
                }}
              >
                {t.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* SOS + Logout */}
        <div
          className="p-3 space-y-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {user.role === 'TRAVELING_EMPLOYEE' && (
            <button
              onClick={triggerSOS}
              className="w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              style={{
                background: sosStatus === 'triggered' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.35)',
                color: '#f87171',
                animation: sosStatus === 'triggered' ? 'sos-pulse 1.2s infinite' : undefined,
              }}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {!isEffectiveCollapsed && <span>{sosStatus === 'triggered' ? 'SOS ACTIVE' : 'EMERGENCY SOS'}</span>}
            </button>
          )}

          <button
            onClick={logout}
            className="w-full py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all font-bold"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171',
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    );
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-transparent backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Sidebar (Overlay Drawer) */}
      <div className="md:hidden">
        {sidebarMarkup(true)}
      </div>

      {/* Desktop Sidebar (Standard side-by-side column) */}
      <div className="hidden md:flex">
        {sidebarMarkup(false)}
      </div>
    </>
  );
}
