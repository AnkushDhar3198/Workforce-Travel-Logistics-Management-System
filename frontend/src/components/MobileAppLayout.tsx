import React, { useState } from 'react';
import { 
  MapPin, Plane, DollarSign, FileText, CheckSquare, Building, ShieldCheck, 
  BarChart2, Truck, Activity, ShieldAlert, LogOut, Menu, X, Sparkles, User as UserIcon,
  Smartphone, Monitor, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LegalModal, { type LegalTabType } from './LegalModal';

interface MobileAppLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: any[];
  loadNotifications: () => void;
  sosStatus?: string;
  triggerSOS?: () => void;
  onToggleDesktopView?: () => void;
  children: React.ReactNode;
}

export default function MobileAppLayout({
  activeTab,
  setActiveTab,
  notifications,
  sosStatus,
  triggerSOS,
  onToggleDesktopView,
  children,
}: MobileAppLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalTabType | null>(null);

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  // Primary Bottom Nav Tabs based on Role
  const roleRole = user?.role || 'TRAVELING_EMPLOYEE';

  const getPrimaryTabs = () => {
    if (roleRole === 'APPROVING_MANAGER') {
      return [
        { id: 'approvals', label: 'Approvals', icon: CheckSquare },
        { id: 'analytics', label: 'ROI Stats', icon: BarChart2 },
        { id: 'security', label: 'Duty Care', icon: Activity },
      ];
    }
    if (roleRole === 'CORPORATE_TRAVEL_MANAGER') {
      return [
        { id: 'vendors', label: 'Vendors', icon: Building },
        { id: 'policy', label: 'Rules', icon: ShieldCheck },
        { id: 'analytics', label: 'Reports', icon: BarChart2 },
      ];
    }
    if (roleRole === 'FINANCE_PROCUREMENT') {
      return [
        { id: 'expenses-finance', label: 'Audit', icon: DollarSign },
        { id: 'analytics', label: 'Reports', icon: BarChart2 },
      ];
    }
    if (roleRole === 'LOGISTICS_COORDINATOR') {
      return [
        { id: 'logistics', label: 'Cargo', icon: Truck },
        { id: 'security', label: 'Safety', icon: Activity },
      ];
    }
    if (roleRole === 'SECURITY_RISK_OFFICER') {
      return [
        { id: 'security', label: 'Security', icon: Activity },
        { id: 'logistics', label: 'Cargo', icon: Truck },
      ];
    }
    // Default Traveling Employee
    return [
      { id: 'itinerary', label: 'Itinerary', icon: MapPin },
      { id: 'requisition', label: 'Request', icon: Plane },
      { id: 'expenses-employee', label: 'Expenses', icon: DollarSign },
      { id: 'docs-employee', label: 'Docs', icon: FileText },
    ];
  };

  const primaryTabs = getPrimaryTabs();

  return (
    <div
      className="flex flex-col h-[100dvh] max-h-[100dvh] w-full overflow-hidden"
      style={{
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* SMARTPHONE TOP HEADER (APPLE & ANDROID NATIVE HEADER) */}
      <header
        className="shrink-0 w-full px-4 h-14 flex items-center justify-between border-b shadow-sm z-40"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'var(--border-subtle)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Brand & User Pill */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-md"
            style={{
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
            }}
          >
            V
          </div>
          <div>
            <h1 className="text-xs font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              VOYACORE
            </h1>
            <p className="text-[10px] font-semibold truncate max-w-[110px]" style={{ color: 'var(--text-muted)' }}>
              {user?.name || 'Mobile App'}
            </p>
          </div>
        </div>

        {/* Right Header Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Theme Quick Switcher */}
          <button
            onClick={() => {
              const themes: Array<'midnight' | 'aurora' | 'daylight' | 'ember'> = ['midnight', 'aurora', 'daylight', 'ember'];
              const next = themes[(themes.indexOf(theme) + 1) % themes.length];
              setTheme(next);
            }}
            className="px-2 py-1 rounded-lg border text-[10px] font-bold capitalize flex items-center gap-1"
            style={{
              background: 'var(--nav-hover-bg)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <Sparkles size={11} className="text-amber-400" />
            <span>{theme}</span>
          </button>

          {/* Desktop Toggle Button */}
          {onToggleDesktopView && (
            <button
              onClick={onToggleDesktopView}
              className="p-1.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1"
              style={{
                background: 'var(--nav-hover-bg)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              title="Switch to Laptop View"
            >
              <Monitor size={14} />
            </button>
          )}

          {/* SOS Alert Button */}
          <button
            onClick={triggerSOS}
            className="px-2.5 py-1 rounded-lg font-black text-[10px] text-white flex items-center gap-1 shadow-sm transition-transform active:scale-95 shrink-0"
            style={{
              background: sosStatus === 'active' ? '#ef4444' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)',
            }}
          >
            <ShieldAlert size={12} />
            <span>SOS</span>
          </button>

          {/* Hamburger Menu / Role Drawer Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 rounded-lg border text-slate-300"
            style={{
              background: 'var(--nav-hover-bg)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* MAIN SMARTPHONE CONTENT AREA (SMOOTH FULL-LENGTH SCROLLABLE) */}
      <main
        className="flex-1 w-full p-4 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          paddingBottom: 'calc(160px + env(safe-area-inset-bottom, 20px))',
        }}
      >
        {children}

        {/* Extra Bottom Spacer to guarantee 100% full content visibility above bottom dock */}
        <div className="h-28 w-full shrink-0 flex items-center justify-center text-[10px] text-slate-500 font-medium pt-6">
          <span>End of Content • VoyaCore Mobile Protocol</span>
        </div>
      </main>

      {/* APPLE iOS & ANDROID NATIVE BOTTOM NAVIGATION DOCK */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 px-2 pt-2 pb-3 border-t shadow-2xl"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px)',
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {primaryTabs.map((t) => {
            const IconComponent = t.icon;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl transition-all duration-200 cursor-pointer"
                style={{
                  color: isActive ? 'var(--btn-primary-text)' : 'var(--text-muted)',
                  background: isActive ? 'var(--btn-primary-bg)' : 'transparent',
                  boxShadow: isActive ? '0 4px 16px var(--accent-glow)' : 'none',
                }}
              >
                <IconComponent size={18} />
                <span className="text-[10px] font-bold mt-1 tracking-tight">{t.label}</span>
              </button>
            );
          })}

          {/* More Drawer Trigger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={18} />
            <span className="text-[10px] font-bold mt-1 tracking-tight">Menu</span>
          </button>
        </div>

        {/* Apple iOS Home Indicator Bar */}
        <div
          className="w-32 h-1 mx-auto mt-2 rounded-full opacity-60"
          style={{ background: 'var(--text-muted)' }}
        />
      </nav>

      {/* SMARTPHONE SLIDE-OVER DRAWER MODAL */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-md animate-fade-in"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-4/5 max-w-xs h-full p-4 flex flex-col border-l shadow-2xl overflow-hidden animate-slide-left"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              color: 'var(--text-primary)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Top Header with Profile & Quick Sign Out */}
            <div className="shrink-0 flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
                  style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                >
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black truncate">{user?.name}</h4>
                  <p className="text-[10px] font-semibold text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Navigation Modules List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-1 pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 mb-2">
                Navigation Modules
              </p>

              {[
                { id: 'itinerary', label: 'My Itinerary', icon: MapPin },
                { id: 'requisition', label: 'Travel Request', icon: Plane },
                { id: 'expenses-employee', label: 'Expense Report', icon: DollarSign },
                { id: 'docs-employee', label: 'Travel Documents', icon: FileText },
                { id: 'approvals', label: 'Pending Approvals', icon: CheckSquare },
                { id: 'vendors', label: 'Preferred Vendors', icon: Building },
                { id: 'policy', label: 'Policy Engine', icon: ShieldCheck },
                { id: 'expenses-finance', label: 'Expense Auditing', icon: DollarSign },
                { id: 'logistics', label: 'Logistics Pipeline', icon: Truck },
                { id: 'security', label: 'Duty of Care Map', icon: Activity },
                { id: 'analytics', label: 'Reports & ROI', icon: BarChart2 },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === item.id ? 'font-black' : ''
                  }`}
                  style={{
                    background: activeTab === item.id ? 'var(--nav-active-bg)' : 'transparent',
                    color: activeTab === item.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: activeTab === item.id ? '1px solid var(--nav-active-border)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="opacity-40" />
                </button>
              ))}
            </div>

            {/* Pinned Bottom Drawer Footer */}
            <div className="shrink-0 pt-3 border-t space-y-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
              {/* Legal Governance & Security Links */}
              <div className="flex items-center justify-around text-[10px] font-bold text-slate-400">
                <button onClick={() => { setIsDrawerOpen(false); setLegalModal('privacy'); }} className="hover:text-cyan-400">Privacy</button>
                <span>•</span>
                <button onClick={() => { setIsDrawerOpen(false); setLegalModal('terms'); }} className="hover:text-cyan-400">Terms</button>
                <span>•</span>
                <button onClick={() => { setIsDrawerOpen(false); setLegalModal('security'); }} className="hover:text-cyan-400">Security</button>
              </div>

              {/* Bottom Logout Button */}
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border font-extrabold text-xs text-rose-400 border-rose-500/30 bg-rose-500/15 hover:bg-rose-500/25 transition-colors shadow-sm"
              >
                <LogOut size={16} />
                <span>Sign Out Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENTERPRISE LEGAL & SECURITY GOVERNANCE MODAL */}
      {legalModal && (
        <LegalModal
          initialTab={legalModal}
          onClose={() => setLegalModal(null)}
        />
      )}
    </div>
  );
}
