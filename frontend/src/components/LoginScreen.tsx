import React, { useState, useRef } from 'react';
import {
  Plane, ShieldAlert, Eye, EyeOff, ArrowRight, X, ChevronDown, Sparkles,
  Shield, Truck, DollarSign, CheckCircle2, BarChart3, Lock, Menu
} from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { useTheme, THEMES, type ThemeId } from '../context/ThemeContext';
import Canvas3DBackground from './Canvas3DBackground';

const CREDENTIALS = [
  { label: 'Traveling Employee', email: 'employee@cbg.com', icon: '✈️', color: '#22d3ee' },
  { label: 'Approving Manager', email: 'manager@cbg.com', icon: '📋', color: '#a78bfa' },
  { label: 'Travel Manager', email: 'travelmanager@cbg.com', icon: '🗺️', color: '#34d399' },
  { label: 'Finance & Audit', email: 'finance@cbg.com', icon: '💰', color: '#fbbf24' },
  { label: 'Security & Risk', email: 'security@cbg.com', icon: '🛡️', color: '#f87171' },
  { label: 'Logistics', email: 'logistics@cbg.com', icon: '📦', color: '#fb923c' },
  { label: 'Admin', email: 'admin@cbg.com', icon: '⚙️', color: '#94a3b8' },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();

  // Auth Modal State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mega-Menu & Navbar Modal State
  const [activeDropdown, setActiveDropdown] = useState<'solutions' | 'autonomy' | null>(null);
  const [featureModal, setFeatureModal] = useState<'duty' | 'logistics' | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const dropdownTimerRef = useRef<any>(null);

  const openLogin = () => {
    setAuthMode('login');
    setError('');
    setIsAuthModalOpen(true);
    setIsMobileNavOpen(false);
  };

  const openSignUp = () => {
    setAuthMode('signup');
    setError('');
    setIsAuthModalOpen(true);
    setIsMobileNavOpen(false);
  };

  const handleMouseEnterDropdown = (menu: 'solutions' | 'autonomy') => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setActiveDropdown(menu);
  };

  const handleMouseLeaveDropdown = () => {
    dropdownTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  const handleAuthSubmit = async (e?: React.FormEvent, selectedEmail?: string) => {
    if (e) e.preventDefault();
    const targetEmail = selectedEmail || email;
    if (!targetEmail) { setError('Please enter or select a valid email address.'); return; }

    setLoading(true);
    setError('');

    try {
      if (authMode === 'signup' && !selectedEmail) {
        const regRes = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name || 'Enterprise User', email: targetEmail, password, role: 'TRAVELING_EMPLOYEE' }),
        });
        if (!regRes.ok) throw new Error('Registration failed. Email may already be registered.');
      }

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password }),
      });
      if (!response.ok) throw new Error('Authentication failed. Check credentials.');

      const data = await response.json();
      const userRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      const userDetail = await userRes.json();
      login(data.token, userDetail);
    } catch (err: any) {
      setError(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
      setLoadingRole(null);
    }
  };

  const handleDirectDemoLogin = (userEmail: string) => {
    setEmail(userEmail);
    setLoadingRole(userEmail);
    setIsMobileNavOpen(false);
    handleAuthSubmit(undefined, userEmail);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* 3D Animated Grid / Particle Canvas Background */}
      <Canvas3DBackground />

      {/* TOP NAVIGATION BAR — TCS Style Enterprise Navbar */}
      <header
        style={{
          position: 'relative',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          background: 'var(--header-bg)',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {/* Left: Brand Logo & Title */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => { setIsAuthModalOpen(false); setFeatureModal(null); setIsMobileNavOpen(false); }}
        >
          <div
            style={{
              width: '34px', height: '34px',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--btn-primary-bg)',
              boxShadow: '0 4px 16px var(--accent-glow)',
              flexShrink: 0,
            }}
          >
            <Plane size={18} style={{ color: 'var(--btn-primary-text)' }} />
          </div>
          <div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.03em', display: 'block', lineHeight: 1.1 }}>
              VOYACORE
            </span>
            <span style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-primary)', display: 'block' }}>
              TRAVEL & LOGISTICS
            </span>
          </div>
        </div>

        {/* Center: Desktop Nav Items with Interactive Mega Menus */}
        <nav className="hidden lg:flex" style={{ alignItems: 'center', gap: '24px', position: 'relative' }}>
          
          {/* 1. SOLUTIONS MEGA-MENU TRIGGER */}
          <div
            onMouseEnter={() => handleMouseEnterDropdown('solutions')}
            onMouseLeave={handleMouseLeaveDropdown}
            style={{ position: 'relative', padding: '8px 0', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: activeDropdown === 'solutions' ? 'var(--accent-primary)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
              <span>Solutions</span>
              <ChevronDown size={14} style={{ transform: activeDropdown === 'solutions' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {/* SOLUTIONS MEGA-MENU DROPDOWN */}
            {activeDropdown === 'solutions' && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '-20px',
                  width: '520px',
                  padding: '18px',
                  borderRadius: '20px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px var(--border-subtle)',
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  zIndex: 50,
                  animation: 'fadeSlideUp 0.2s ease both',
                }}
              >
                <div
                  onClick={() => handleDirectDemoLogin('employee@cbg.com')}
                  style={{ padding: '12px', borderRadius: '14px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(34,211,238,0.15)', color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plane size={14} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Workforce Mobility</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                    Flight booking & PNR digital boarding passes.
                  </p>
                </div>

                <div
                  onClick={() => handleDirectDemoLogin('manager@cbg.com')}
                  style={{ padding: '12px', borderRadius: '14px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={14} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Manager Approvals</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                    Budget authorization & compliance routing.
                  </p>
                </div>

                <div
                  onClick={() => handleDirectDemoLogin('finance@cbg.com')}
                  style={{ padding: '12px', borderRadius: '14px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DollarSign size={14} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Expense Auditing</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                    OCR receipt parsing & per-diem rules.
                  </p>
                </div>

                <div
                  onClick={() => handleDirectDemoLogin('logistics@cbg.com')}
                  style={{ padding: '12px', borderRadius: '14px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(251,146,60,0.15)', color: '#fb923c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Truck size={14} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Cargo Logistics</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                    Air freight manifests & customs clearance.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. PLATFORM AUTONOMY MEGA-MENU TRIGGER */}
          <div
            onMouseEnter={() => handleMouseEnterDropdown('autonomy')}
            onMouseLeave={handleMouseLeaveDropdown}
            style={{ position: 'relative', padding: '8px 0', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: activeDropdown === 'autonomy' ? 'var(--accent-primary)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
              <span>Platform Autonomy</span>
              <ChevronDown size={14} style={{ transform: activeDropdown === 'autonomy' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {/* AUTONOMY MEGA-MENU DROPDOWN */}
            {activeDropdown === 'autonomy' && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '-20px',
                  width: '520px',
                  padding: '18px',
                  borderRadius: '20px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px var(--border-subtle)',
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  zIndex: 50,
                  animation: 'fadeSlideUp 0.2s ease both',
                }}
              >
                <div
                  onClick={() => handleDirectDemoLogin('travelmanager@cbg.com')}
                  style={{ padding: '12px', borderRadius: '14px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(52,211,153,0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={14} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Level 5 AI Engine</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                    Autonomous rebooking & smart policy enforcement.
                  </p>
                </div>

                <div
                  onClick={() => handleDirectDemoLogin('security@cbg.com')}
                  style={{ padding: '12px', borderRadius: '14px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(248,113,113,0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={14} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Duty of Care GPS</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                    Traveler heatmap & 24/7 emergency dispatch.
                  </p>
                </div>

                <div
                  onClick={() => handleDirectDemoLogin('admin@cbg.com')}
                  style={{ padding: '12px', borderRadius: '14px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(148,163,184,0.15)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={14} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Audit & Governance</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                    Security event logs & corporate RBAC.
                  </p>
                </div>

                <div
                  onClick={() => handleDirectDemoLogin('finance@cbg.com')}
                  style={{ padding: '12px', borderRadius: '14px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BarChart3 size={14} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Spend Analytics</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                    Executive budget & discount analytics.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 3. DUTY OF CARE ACTION */}
          <div
            onClick={() => setFeatureModal('duty')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', transition: 'color 0.2s' }}
          >
            <span>Duty of Care</span>
          </div>

          {/* 4. LOGISTICS MANIFEST ACTION */}
          <div
            onClick={() => setFeatureModal('logistics')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', transition: 'color 0.2s' }}
          >
            <span>Logistics Manifest</span>
          </div>
        </nav>

        {/* Right Side: Theme Selector + LOG IN & SIGN UP OPTIONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Theme Picker */}
          <div className="hidden sm:flex" style={{ alignItems: 'center', gap: '3px', marginRight: '4px' }}>
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as ThemeId)}
                title={t.name}
                style={{
                  padding: '4px 7px',
                  borderRadius: '100px',
                  border: '1px solid',
                  borderColor: theme === t.id ? 'var(--border-active)' : 'transparent',
                  background: theme === t.id ? 'var(--nav-active-bg)' : 'transparent',
                  color: theme === t.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{t.emoji}</span>
              </button>
            ))}
          </div>

          {/* LOG IN BUTTON (Right side of navbar) */}
          <button
            onClick={openLogin}
            style={{
              padding: '8px 15px',
              borderRadius: '100px',
              border: '1px solid var(--border-default)',
              background: 'var(--nav-hover-bg)',
              color: 'var(--text-primary)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(12px)',
              whiteSpace: 'nowrap',
            }}
          >
            Log In
          </button>

          {/* SIGN UP BUTTON (Right side of navbar) */}
          <button
            onClick={openSignUp}
            style={{
              padding: '8px 16px',
              borderRadius: '100px',
              border: 'none',
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px var(--accent-glow)',
              whiteSpace: 'nowrap',
            }}
          >
            Sign Up
          </button>

          {/* Mobile Hamburger Toggle (Visible on Mobile Screens) */}
          <button
            onClick={() => setIsMobileNavOpen(v => !v)}
            className="flex lg:hidden"
            style={{
              padding: '8px',
              borderRadius: '10px',
              border: '1px solid var(--border-default)',
              background: 'var(--nav-hover-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER (Slide down on Smartphones) */}
      {isMobileNavOpen && (
        <div
          className="lg:hidden"
          style={{
            position: 'fixed',
            top: '56px',
            insetX: 0,
            zIndex: 35,
            padding: '20px',
            background: 'var(--card-bg)',
            borderBottom: '1px solid var(--card-border)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            animation: 'fadeSlideDown 0.25s ease both',
          }}
        >
          {/* Mobile Theme Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Select Theme</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as ThemeId)}
                  style={{
                    padding: '6px 10px', borderRadius: '100px', border: '1px solid',
                    borderColor: theme === t.id ? 'var(--border-active)' : 'transparent',
                    background: theme === t.id ? 'var(--nav-active-bg)' : 'transparent',
                    fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  {t.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Nav Solutions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Enterprise Solutions</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => handleDirectDemoLogin('employee@cbg.com')}
                style={{ padding: '10px', borderRadius: '12px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>✈️ Mobility</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Flight Bookings</div>
              </button>
              <button
                onClick={() => handleDirectDemoLogin('manager@cbg.com')}
                style={{ padding: '10px', borderRadius: '12px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>📋 Approvals</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Manager Portal</div>
              </button>
              <button
                onClick={() => handleDirectDemoLogin('finance@cbg.com')}
                style={{ padding: '10px', borderRadius: '12px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>💰 Expenses</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Audit & OCR</div>
              </button>
              <button
                onClick={() => handleDirectDemoLogin('logistics@cbg.com')}
                style={{ padding: '10px', borderRadius: '12px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>📦 Cargo</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Air Logistics</div>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={() => { setIsMobileNavOpen(false); setFeatureModal('duty'); }}
              style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-default)', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              🛡️ Duty of Care
            </button>
            <button
              onClick={() => { setIsMobileNavOpen(false); setFeatureModal('logistics'); }}
              style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-default)', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              📦 Cargo Manifest
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION — TCS / Enterprise Autonomy Style */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '820px', width: '100%', margin: 'auto 0' }}>
          {/* Level 5 Autonomy Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '100px',
              background: 'var(--nav-active-bg)',
              border: '1px solid var(--nav-active-border)',
              color: 'var(--accent-primary)',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '18px',
              maxWidth: '90vw',
              animation: 'fadeSlideDown 0.6s ease both',
            }}
          >
            <Sparkles size={13} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>LEVEL 5 HUMAN + AI AUTONOMY MODEL</span>
          </div>

          {/* Main Hero Headline */}
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(1.75rem, 5.5vw, 3.4rem)',
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              margin: '0 0 16px',
              lineHeight: 1.12,
              wordBreak: 'break-word',
            }}
          >
            Next-Gen Workforce Travel & Logistics Management
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.15rem)',
              color: 'var(--text-secondary)',
              margin: '0 auto 28px',
              maxWidth: '680px',
              lineHeight: 1.5,
            }}
          >
            Unified enterprise platform for real-time travel itineraries, border control clearance, automated expense auditing, custom logistics manifests, and duty-of-care security.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <button
              onClick={openLogin}
              style={{
                padding: '13px 28px',
                borderRadius: '100px',
                border: 'none',
                background: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 8px 32px var(--accent-glow-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.22s ease',
                minWidth: '200px',
              }}
            >
              <span>Sign In to Portal</span>
              <ArrowRight size={17} />
            </button>

            <button
              onClick={openSignUp}
              style={{
                padding: '13px 26px',
                borderRadius: '100px',
                border: '1px solid var(--border-default)',
                background: 'var(--nav-hover-bg)',
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.22s ease',
                minWidth: '180px',
              }}
            >
              Create Account
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        style={{
          position: 'relative',
          zIndex: 20,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'var(--header-bg)',
        }}
      >
        <div>Copyright © 2026 VoyaCore Enterprise Inc.</div>
        <div style={{ display: 'flex', gap: '14px' }}>
          <span>Privacy Policy</span>
          <span>Terms</span>
          <span>Security</span>
        </div>
      </footer>

      {/* FEATURE MODAL 1: DUTY OF CARE SHOWCASE */}
      {featureModal === 'duty' && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            background: 'transparent', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.2s ease both',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setFeatureModal(null); }}
        >
          <div style={{ width: 'calc(100vw - 32px)', maxWidth: '520px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '20px', backdropFilter: 'blur(32px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(248,113,113,0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Duty of Care & Security</h3>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Global Real-Time Risk Engine</span>
                </div>
              </div>
              <button onClick={() => setFeatureModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>
              Protects corporate travelers with real-time GPS heatmaps, automated travel warning alerts, and instant 24/7 SOS dispatch with emergency responder coordination.
            </p>
            <button
              onClick={() => { setFeatureModal(null); handleDirectDemoLogin('security@cbg.com'); }}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
            >
              Open Security Command Center →
            </button>
          </div>
        </div>
      )}

      {/* FEATURE MODAL 2: LOGISTICS MANIFEST SHOWCASE */}
      {featureModal === 'logistics' && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            background: 'transparent', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.2s ease both',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setFeatureModal(null); }}
        >
          <div style={{ width: 'calc(100vw - 32px)', maxWidth: '520px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '20px', backdropFilter: 'blur(32px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(251,146,60,0.15)', color: '#fb923c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Supply Cargo Logistics</h3>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Air Cargo & Customs Manifests</span>
                </div>
              </div>
              <button onClick={() => setFeatureModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>
              Tracks international cargo manifests, custom clearance documents, bills of lading, and automated freight handler pipeline statuses in real-time.
            </p>
            <button
              onClick={() => { setFeatureModal(null); handleDirectDemoLogin('logistics@cbg.com'); }}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
            >
              Open Logistics Pipeline →
            </button>
          </div>
        </div>
      )}

      {/* AUTHENTICATION MODAL (Triggered by Log In / Sign Up on Navbar or CTAs) */}
      {isAuthModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'transparent',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            animation: 'fadeIn 0.25s ease both',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsAuthModalOpen(false); }}
        >
          <div
            style={{
              width: 'calc(100vw - 24px)',
              maxWidth: '440px',
              maxHeight: '88vh',
              borderRadius: '24px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              overflowY: 'auto',
              position: 'relative',
              animation: 'popIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
            }}
          >
            {/* Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'var(--btn-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plane size={14} style={{ color: 'var(--btn-primary-text)' }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {authMode === 'login' ? 'Log In to VoyaCore' : 'Create VoyaCore Account'}
                </span>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'var(--nav-hover-bg)', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px 20px 20px' }}>
              {/* Tab Toggle: Log In / Sign Up */}
              <div style={{ display: 'flex', borderRadius: '12px', background: 'var(--nav-hover-bg)', padding: '3px', marginBottom: '14px' }}>
                <button
                  onClick={() => setAuthMode('login')}
                  style={{
                    flex: 1, padding: '7px', borderRadius: '10px', border: 'none',
                    background: authMode === 'login' ? 'var(--card-bg)' : 'transparent',
                    color: authMode === 'login' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                >
                  Log In
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  style={{
                    flex: 1, padding: '7px', borderRadius: '10px', border: 'none',
                    background: authMode === 'signup' ? 'var(--card-bg)' : 'transparent',
                    color: authMode === 'signup' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                >
                  Sign Up
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  marginBottom: '12px', padding: '10px 12px',
                  borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5', fontSize: '0.78rem', fontWeight: 600,
                }}>
                  <ShieldAlert size={14} />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Inputs */}
              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {authMode === 'signup' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '12px', outline: 'none', boxSizing: 'border-box',
                        background: 'var(--input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '16px',
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '12px', outline: 'none', boxSizing: 'border-box',
                      background: 'var(--input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '16px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%', padding: '10px 38px 10px 12px', borderRadius: '12px', outline: 'none', boxSizing: 'border-box',
                        background: 'var(--input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '16px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '11px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', fontWeight: 800, fontSize: '0.88rem',
                    boxShadow: '0 4px 16px var(--accent-glow)', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  {loading ? 'Authenticating...' : authMode === 'login' ? 'Sign In to Portal' : 'Create Account'}
                </button>
              </form>

              {/* Quick Demo Credentials */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
                  Quick Demo Access (1-Click Login)
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                  {CREDENTIALS.map(cred => (
                    <button
                      key={cred.email}
                      onClick={() => { setEmail(cred.email); setLoadingRole(cred.email); handleAuthSubmit(undefined, cred.email); }}
                      disabled={loading}
                      style={{
                        padding: '5px 9px', borderRadius: '100px', cursor: 'pointer',
                        background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)',
                        fontSize: '10.5px', fontWeight: 700, color: cred.color, display: 'flex', alignItems: 'center', gap: '3px'
                      }}
                    >
                      <span>{cred.icon}</span>
                      <span>{cred.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
