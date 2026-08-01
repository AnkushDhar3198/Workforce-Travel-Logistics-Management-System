import React, { useState, useEffect } from 'react';
import { Plane, ShieldAlert, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async (e?: React.FormEvent, selectedEmail?: string) => {
    if (e) e.preventDefault();
    const targetEmail = selectedEmail || email;
    if (!targetEmail) { setError('Please enter or select an email address.'); return; }

    setLoading(true);
    setError('');

    try {
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
        height: '100vh',
        height: '100dvh', // dynamic viewport height for mobile browsers (iOS Safari)
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 3D Animated Canvas Background */}
      <Canvas3DBackground />

      {/* Top Header — Mobile & Desktop Responsive */}
      <header
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(0, 0, 0, 0.05)',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px', height: '28px',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--btn-primary-bg)',
              boxShadow: '0 4px 12px var(--accent-glow)',
              flexShrink: 0,
            }}
          >
            <Plane size={16} style={{ color: 'var(--btn-primary-text)' }} />
          </div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            VoyaCore
          </span>
        </div>

        {/* Theme Picker Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as ThemeId)}
              title={t.name}
              style={{
                padding: '5px 10px',
                borderRadius: '100px',
                border: '1px solid',
                borderColor: theme === t.id ? 'var(--border-active)' : 'transparent',
                background: theme === t.id ? 'var(--nav-active-bg)' : 'transparent',
                color: theme === t.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{t.emoji}</span>
              <span className="hidden md:inline" style={{ fontSize: '11px' }}>{t.name}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Container — Touch scrollable & perfectly fits all phone screens */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 14px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            textAlign: 'center',
            margin: 'auto 0',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* Hero Heading — Fluid typography for iPhone 17 & all mobile displays */}
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(1.6rem, 5.5vw, 2.2rem)',
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              margin: '0 0 8px',
              lineHeight: 1.15,
            }}
          >
            Sign In to VoyaCore
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.8rem, 2.8vw, 0.92rem)',
              color: 'var(--text-secondary)',
              margin: '0 0 20px',
              lineHeight: 1.4,
              padding: '0 8px',
            }}
          >
            One VoyaCore Account is all you need to access all workforce travel & logistics services.
          </p>

          {/* Error Banner */}
          {error && (
            <div style={{
              marginBottom: '14px', padding: '10px 14px',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600,
              animation: 'fadeSlideUp 0.3s ease both',
            }}>
              <ShieldAlert size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields — 16px font size on mobile to prevent iOS Safari unwanted zoom */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '420px', margin: '0 auto' }}>
            <div style={{ textAlign: 'left' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Corporate Email (e.g. name@company.com)"
                style={{
                  width: '100%', padding: '12px 16px',
                  borderRadius: '14px', outline: 'none', boxSizing: 'border-box',
                  background: 'var(--input)', border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)', fontSize: '16px', // 16px prevents iOS Safari auto-zoom
                  fontFamily: 'Inter, sans-serif',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  transition: 'all 0.2s ease',
                  minHeight: '46px',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ textAlign: 'left', position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                style={{
                  width: '100%', padding: '12px 46px 12px 16px',
                  borderRadius: '14px', outline: 'none', boxSizing: 'border-box',
                  background: 'var(--input)', border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)', fontSize: '16px', // 16px prevents iOS Safari auto-zoom
                  fontFamily: 'Inter, sans-serif',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  transition: 'all 0.2s ease',
                  minHeight: '46px',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', padding: '6px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '14px', border: 'none', cursor: 'pointer',
                background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)',
                fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '0.92rem',
                letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: '0 4px 20px var(--accent-glow)',
                minHeight: '46px',
                marginTop: '2px',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px var(--accent-glow-strong)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px var(--accent-glow)'; }}
              onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
            >
              {loading ? (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin-slow 0.8s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Authenticating...</>
              ) : (
                <><span>Sign In</span><ArrowRight size={17} /></>
              )}
            </button>
          </form>

          {/* Quick Access Credentials Section — Responsive Pill Chips */}
          <div style={{ marginTop: '20px', width: '100%', maxWidth: '440px', margin: '20px auto 0' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Quick Access Demo Credentials
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              {CREDENTIALS.map((cred) => (
                <button
                  key={cred.email}
                  onClick={() => { setEmail(cred.email); setLoadingRole(cred.email); handleLogin(undefined, cred.email); }}
                  disabled={loading}
                  style={{
                    padding: '7px 11px',
                    borderRadius: '100px',
                    cursor: 'pointer',
                    background: 'var(--nav-hover-bg)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'Inter, sans-serif',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = cred.color + '80';
                    el.style.background = cred.color + '1a';
                    el.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'var(--border-subtle)';
                    el.style.background = 'var(--nav-hover-bg)';
                    el.style.transform = '';
                  }}
                >
                  <span style={{ fontSize: '12px' }}>{cred.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: cred.color }}>
                    {cred.label}
                  </span>
                  {loadingRole === cred.email && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ color: cred.color, animation: 'spin-slow 0.8s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          position: 'relative',
          zIndex: 20,
          padding: '10px 16px',
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
          textAlign: 'center',
          fontSize: '10px',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(0, 0, 0, 0.05)',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        Copyright © 2026 VoyaCore Inc. All rights reserved. Enterprise Workforce Travel & Logistics.
      </footer>
    </div>
  );
}
