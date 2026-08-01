import React, { useState, useRef, useEffect } from 'react';
import { Plane, ShieldAlert, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';
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

/** 3D tilt card that follows mouse (completely borderless) */
function TiltCard({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;   // 0..1
    const y = (e.clientY - rect.top) / rect.height;
    const ry = (x - 0.5) * 16;   // max ±8deg
    const rx = (0.5 - y) * 12;
    setTilt({ rx, ry, gx: x * 100, gy: y * 100 });
  };

  const onMouseLeave = () => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(1.01,1.01,1.01)`,
        transition: 'transform 0.12s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Specular highlight */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.06), transparent 60%)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {children}
    </div>
  );
}

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        inset: 0,
      }}
    >
      {/* Full-screen 3D canvas */}
      <Canvas3DBackground />

      {/* Content layer — strictly fits 100vw / 100vh without scrollbars */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '430px',
            maxHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <TiltCard
            style={{
              borderRadius: '24px',
              overflow: 'visible',
              position: 'relative',
            }}
          >
            {/* Borderless Glass Panel */}
            <div
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                background: 'rgba(15, 10, 30, 0.35)',
                border: 'none',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
              }}
            >
              {/* Top Accent Gradient Bar */}
              <div style={{ height: '3px', background: 'var(--btn-primary-bg)', border: 'none' }} />

              <div style={{ padding: '24px 28px' }}>
                {/* Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '18px' }}>
                  <div
                    style={{
                      width: '52px', height: '52px',
                      borderRadius: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--btn-primary-bg)',
                      boxShadow: '0 8px 24px var(--accent-glow-strong)',
                      marginBottom: '10px',
                      animation: 'bounceIn 0.7s cubic-bezier(0.22,1,0.36,1) both',
                      border: 'none',
                    }}
                  >
                    <Plane style={{ width: 26, height: 26, color: 'var(--btn-primary-text)' }} />
                  </div>
                  <h1 style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 900,
                    fontSize: '1.8rem',
                    letterSpacing: '-0.04em',
                    margin: 0,
                    background: 'var(--btn-primary-bg)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    VoyaCore
                  </h1>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0', textAlign: 'center' }}>
                    Enterprise Workforce Travel & Logistics
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div style={{
                    marginBottom: '14px', padding: '10px 14px',
                    borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(239,68,68,0.15)', border: 'none',
                    color: '#fca5a5', fontSize: '0.8rem',
                    animation: 'fadeSlideUp 0.3s ease both',
                  }}>
                    <ShieldAlert style={{ width: 15, height: 15, flexShrink: 0 }} />
                    {error}
                  </div>
                )}

                {/* Form Inputs (Borderless) */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px' }}>
                      Corporate Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      style={{
                        width: '100%', padding: '11px 14px',
                        borderRadius: '12px', outline: 'none', border: 'none', boxSizing: 'border-box',
                        background: 'rgba(255, 255, 255, 0.07)',
                        color: 'var(--text-primary)', fontSize: '0.85rem',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'box-shadow 0.2s, background 0.2s',
                      }}
                      onFocus={e => { e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; e.target.style.background = 'rgba(255, 255, 255, 0.12)'; }}
                      onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255, 255, 255, 0.07)'; }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{
                          width: '100%', padding: '11px 40px 11px 14px',
                          borderRadius: '12px', outline: 'none', border: 'none', boxSizing: 'border-box',
                          background: 'rgba(255, 255, 255, 0.07)',
                          color: 'var(--text-primary)', fontSize: '0.85rem',
                          fontFamily: 'Inter, sans-serif',
                          transition: 'box-shadow 0.2s, background 0.2s',
                        }}
                        onFocus={e => { e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; e.target.style.background = 'rgba(255, 255, 255, 0.12)'; }}
                        onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255, 255, 255, 0.07)'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        style={{
                          position: 'absolute', right: '12px', top: '50%',
                          transform: 'translateY(-50%)', padding: '4px',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '12px',
                      borderRadius: '12px', border: 'none', cursor: 'pointer',
                      background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)',
                      fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '0.875rem',
                      letterSpacing: '0.02em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      boxShadow: '0 4px 20px var(--accent-glow)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px var(--accent-glow-strong)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px var(--accent-glow)'; }}
                    onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
                    onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
                  >
                    {loading ? (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin-slow 0.8s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Authenticating...</>
                    ) : (
                      <><span>Sign In</span><ArrowRight size={15} /></>
                    )}
                  </button>
                </form>

                {/* Quick Access Divider (Borderless) */}
                <div style={{ position: 'relative', margin: '16px 0 14px' }}>
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      padding: '2px 10px', fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.14em',
                      textTransform: 'uppercase', color: 'var(--text-muted)',
                      background: 'rgba(255, 255, 255, 0.05)', borderRadius: '100px',
                    }}>Quick Access</span>
                  </div>
                </div>

                {/* Role Quick Access Buttons (Borderless Glass) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                  {CREDENTIALS.map((cred, i) => (
                    <button
                      key={cred.email}
                      onClick={() => { setEmail(cred.email); setLoadingRole(cred.email); handleLogin(undefined, cred.email); }}
                      disabled={loading}
                      style={{
                        textAlign: 'left', padding: '9px 11px',
                        borderRadius: '12px', cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: 'none',
                        fontFamily: 'Inter, sans-serif',
                        animation: `fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) ${0.2 + i * 0.04}s both`,
                        transition: 'transform 0.2s ease, background 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = cred.color + '1a';
                        el.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = 'rgba(255, 255, 255, 0.04)';
                        el.style.transform = '';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13px' }}>{cred.icon}</span>
                        {loadingRole === cred.email && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ color: cred.color, animation: 'spin-slow 0.8s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                            <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                        )}
                      </div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: cred.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cred.label}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cred.email}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>

          <p style={{ textAlign: 'center', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '12px' }}>
            VoyaCore — Enterprise Travel Management Platform
          </p>
        </div>
      </div>
    </div>
  );
}
