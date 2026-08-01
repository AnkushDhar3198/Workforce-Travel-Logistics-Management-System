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
        overflow: 'hidden',
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 3D Animated Canvas Background */}
      <Canvas3DBackground />

      {/* Top Header — Apple Account Style */}
      <header
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 40px',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px', height: '32px',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--btn-primary-bg)',
              boxShadow: '0 4px 12px var(--accent-glow)',
            }}
          >
            <Plane size={18} style={{ color: 'var(--btn-primary-text)' }} />
          </div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            VoyaCore Account
          </span>
        </div>

        {/* Theme Picker Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as ThemeId)}
              title={t.name}
              style={{
                padding: '6px 12px',
                borderRadius: '100px',
                border: '1px solid',
                borderColor: theme === t.id ? 'var(--border-active)' : 'transparent',
                background: theme === t.id ? 'var(--nav-active-bg)' : 'transparent',
                color: theme === t.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{t.emoji}</span>
              <span style={{ display: 'none' }} className="sm-inline">{t.name}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Apple Account Centered Container — No Card Box */}
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
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            textAlign: 'center',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* Hero Heading — Apple Account style */}
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: '2.4rem',
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              margin: '0 0 10px',
              lineHeight: 1.15,
            }}
          >
            Sign In to VoyaCore
          </h1>

          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              margin: '0 0 28px',
              lineHeight: 1.45,
            }}
          >
            One VoyaCore Account is all you need to access all workforce travel & logistics services.
          </p>

          {/* Error Banner */}
          {error && (
            <div style={{
              marginBottom: '16px', padding: '12px 18px',
              borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600,
              animation: 'fadeSlideUp 0.3s ease both',
            }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields — Floating Pill Inputs */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '440px', margin: '0 auto' }}>
            <div style={{ textAlign: 'left' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Corporate Email (e.g. name@company.com)"
                style={{
                  width: '100%', padding: '14px 18px',
                  borderRadius: '14px', outline: 'none', boxSizing: 'border-box',
                  background: 'var(--input)', border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)', fontSize: '0.95rem',
                  fontFamily: 'Inter, sans-serif',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  transition: 'all 0.2s ease',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 4px var(--accent-glow)'; }}
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
                  width: '100%', padding: '14px 48px 14px 18px',
                  borderRadius: '14px', outline: 'none', boxSizing: 'border-box',
                  background: 'var(--input)', border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)', fontSize: '0.95rem',
                  fontFamily: 'Inter, sans-serif',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  transition: 'all 0.2s ease',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 4px var(--accent-glow)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)', padding: '4px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                borderRadius: '14px', border: 'none', cursor: 'pointer',
                background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)',
                fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '0.95rem',
                letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: '0 6px 24px var(--accent-glow)',
                marginTop: '4px',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 32px var(--accent-glow-strong)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px var(--accent-glow)'; }}
              onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
            >
              {loading ? (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin-slow 0.8s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Authenticating...</>
              ) : (
                <><span>Sign In</span><ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Quick Access Credentials Section */}
          <div style={{ marginTop: '28px', maxWidth: '440px', margin: '28px auto 0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Quick Access Demo Credentials
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {CREDENTIALS.map((cred) => (
                <button
                  key={cred.email}
                  onClick={() => { setEmail(cred.email); setLoadingRole(cred.email); handleLogin(undefined, cred.email); }}
                  disabled={loading}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '100px',
                    cursor: 'pointer',
                    background: 'var(--nav-hover-bg)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'Inter, sans-serif',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
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
                  <span style={{ fontSize: '13px' }}>{cred.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: cred.color }}>
                    {cred.label}
                  </span>
                  {loadingRole === cred.email && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: cred.color, animation: 'spin-slow 0.8s linear infinite' }}>
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
          padding: '16px',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(0, 0, 0, 0.05)',
        }}
      >
        Copyright © 2026 VoyaCore Inc. All rights reserved. Enterprise Workforce Travel & Logistics.
      </footer>
    </div>
  );
}
