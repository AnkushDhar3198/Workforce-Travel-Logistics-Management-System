import React, { useState } from 'react';
import { Plane, ShieldAlert, Eye, EyeOff, ArrowRight, X, ChevronDown, Sparkles } from 'lucide-react';
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
  
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeNavDropdown, setActiveNavDropdown] = useState<string | null>(null);

  const openLogin = () => {
    setAuthMode('login');
    setError('');
    setIsAuthModalOpen(true);
  };

  const openSignUp = () => {
    setAuthMode('signup');
    setError('');
    setIsAuthModalOpen(true);
  };

  const handleAuthSubmit = async (e?: React.FormEvent, selectedEmail?: string) => {
    if (e) e.preventDefault();
    const targetEmail = selectedEmail || email;
    if (!targetEmail) { setError('Please enter or select a valid email address.'); return; }

    setLoading(true);
    setError('');

    try {
      if (authMode === 'signup' && !selectedEmail) {
        // Register API call
        const regRes = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name || 'Enterprise User', email: targetEmail, password, role: 'TRAVELING_EMPLOYEE' }),
        });
        if (!regRes.ok) throw new Error('Registration failed. Email may already be registered.');
      }

      // Login API call
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
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 32px',
          paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          background: 'rgba(0, 0, 0, 0.2)',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {/* Left: Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setIsAuthModalOpen(false)}>
          <div
            style={{
              width: '36px', height: '36px',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--btn-primary-bg)',
              boxShadow: '0 4px 16px var(--accent-glow)',
              flexShrink: 0,
            }}
          >
            <Plane size={20} style={{ color: 'var(--btn-primary-text)' }} />
          </div>
          <div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.15rem', color: 'var(--text-primary)', letterSpacing: '-0.03em', display: 'block', lineHeight: 1.1 }}>
              VOYACORE
            </span>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-primary)', display: 'block' }}>
              TRAVEL & LOGISTICS
            </span>
          </div>
        </div>

        {/* Center: Desktop Nav Items (TCS style) */}
        <nav className="hidden lg:flex" style={{ alignItems: 'center', gap: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span>Solutions</span>
            <ChevronDown size={14} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span>Platform Autonomy</span>
            <ChevronDown size={14} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span>Duty of Care</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span>Logistics Manifest</span>
          </div>
        </nav>

        {/* Right Side: Theme Selector + LOG IN & SIGN UP OPTIONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Theme Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '6px' }}>
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as ThemeId)}
                title={t.name}
                style={{
                  padding: '5px 8px',
                  borderRadius: '100px',
                  border: '1px solid',
                  borderColor: theme === t.id ? 'var(--border-active)' : 'transparent',
                  background: theme === t.id ? 'var(--nav-active-bg)' : 'transparent',
                  color: theme === t.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: '12px',
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
              padding: '9px 18px',
              borderRadius: '100px',
              border: '1px solid var(--border-default)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-primary)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-active)'; (e.currentTarget as HTMLElement).style.background = 'var(--nav-active-bg)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)'; }}
          >
            Log In
          </button>

          {/* SIGN UP BUTTON (Right side of navbar) */}
          <button
            onClick={openSignUp}
            style={{
              padding: '9px 20px',
              borderRadius: '100px',
              border: 'none',
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px var(--accent-glow)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px var(--accent-glow-strong)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px var(--accent-glow)'; }}
          >
            Sign Up
          </button>
        </div>
      </header>

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
          padding: '24px 20px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '820px', margin: 'auto 0' }}>
          {/* Level 5 Autonomy Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '100px',
              background: 'var(--nav-active-bg)',
              border: '1px solid var(--nav-active-border)',
              color: 'var(--accent-primary)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '20px',
              animation: 'fadeSlideDown 0.6s ease both',
            }}
          >
            <Sparkles size={14} />
            <span>LEVEL 5 HUMAN + AI SERVICE AUTONOMY MODEL</span>
          </div>

          {/* Main Hero Headline */}
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(2rem, 5.5vw, 3.6rem)',
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              margin: '0 0 16px',
              lineHeight: 1.12,
            }}
          >
            Next-Gen Workforce Travel & Logistics Management
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
              color: 'var(--text-secondary)',
              margin: '0 auto 32px',
              maxWidth: '680px',
              lineHeight: 1.55,
            }}
          >
            Unified enterprise platform for real-time travel itineraries, border control clearance, automated expense auditing, custom logistics manifests, and duty-of-care security.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={openLogin}
              style={{
                padding: '14px 32px',
                borderRadius: '100px',
                border: 'none',
                background: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 32px var(--accent-glow-strong)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.22s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              <span>Sign In to Portal</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={openSignUp}
              style={{
                padding: '14px 28px',
                borderRadius: '100px',
                border: '1px solid var(--border-default)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.22s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-active)'; (e.currentTarget as HTMLElement).style.background = 'var(--nav-active-bg)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)'; }}
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
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(0, 0, 0, 0.15)',
        }}
      >
        <div>Copyright © 2026 VoyaCore Enterprise Inc. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Security Compliance</span>
        </div>
      </footer>

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
              width: '100%',
              maxWidth: '440px',
              borderRadius: '24px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              overflow: 'hidden',
              position: 'relative',
              animation: 'popIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
            }}
          >
            {/* Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--btn-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plane size={15} style={{ color: 'var(--btn-primary-text)' }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {authMode === 'login' ? 'Log In to VoyaCore' : 'Create VoyaCore Account'}
                </span>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'var(--nav-hover-bg)', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px 24px' }}>
              {/* Tab Toggle: Log In / Sign Up */}
              <div style={{ display: 'flex', borderRadius: '12px', background: 'var(--nav-hover-bg)', padding: '3px', marginBottom: '16px' }}>
                <button
                  onClick={() => setAuthMode('login')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                    background: authMode === 'login' ? 'var(--card-bg)' : 'transparent',
                    color: authMode === 'login' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                    boxShadow: authMode === 'login' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  Log In
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                    background: authMode === 'signup' ? 'var(--card-bg)' : 'transparent',
                    color: authMode === 'signup' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                    boxShadow: authMode === 'signup' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  Sign Up
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  marginBottom: '14px', padding: '10px 14px',
                  borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600,
                }}>
                  <ShieldAlert size={15} />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Inputs */}
              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                        width: '100%', padding: '11px 14px', borderRadius: '12px', outline: 'none', boxSizing: 'border-box',
                        background: 'var(--input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '14px',
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
                      width: '100%', padding: '11px 14px', borderRadius: '12px', outline: 'none', boxSizing: 'border-box',
                      background: 'var(--input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '14px',
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
                        width: '100%', padding: '11px 40px 11px 14px', borderRadius: '12px', outline: 'none', boxSizing: 'border-box',
                        background: 'var(--input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '14px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', fontWeight: 800, fontSize: '0.9rem',
                    boxShadow: '0 4px 16px var(--accent-glow)', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {loading ? 'Authenticating...' : authMode === 'login' ? 'Sign In to Portal' : 'Create Account'}
                </button>
              </form>

              {/* Quick Demo Credentials */}
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
                  Quick Demo Access (1-Click Login)
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                  {CREDENTIALS.map(cred => (
                    <button
                      key={cred.email}
                      onClick={() => { setEmail(cred.email); setLoadingRole(cred.email); handleAuthSubmit(undefined, cred.email); }}
                      disabled={loading}
                      style={{
                        padding: '6px 10px', borderRadius: '100px', cursor: 'pointer',
                        background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)',
                        fontSize: '11px', fontWeight: 700, color: cred.color, display: 'flex', alignItems: 'center', gap: '4px'
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
