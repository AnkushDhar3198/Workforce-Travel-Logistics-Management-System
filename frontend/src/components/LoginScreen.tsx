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

/** 3D tilt card that follows mouse */
function TiltCard({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;   // 0..1
    const y = (e.clientY - rect.top) / rect.height;
    const ry = (x - 0.5) * 18;   // max ±9deg
    const rx = (0.5 - y) * 14;
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
          background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.08), transparent 60%)`,
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
    const t = setTimeout(() => setMounted(true), 80);
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
        position: 'relative',
      }}
    >
      {/* Full-screen 3D canvas */}
      <Canvas3DBackground />

      {/* Content layer */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100%',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <TiltCard
            style={{
              borderRadius: '24px',
              overflow: 'visible',
              position: 'relative',
            }}
          >
            <div
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                background: 'rgba(15, 10, 30, 0.35)',
                border: '1px solid var(--border-default)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px var(--border-subtle), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Gradient top bar */}
              <div style={{ height: '2px', background: 'var(--btn-primary-bg)' }} />

              <div style={{ padding: '32px' }}>
                {/* Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
                  <div
                    style={{
                      width: '64px', height: '64px',
                      borderRadius: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--btn-primary-bg)',
                      boxShadow: '0 8px 32px var(--accent-glow-strong)',
                      marginBottom: '14px',
                      animation: 'bounceIn 0.7s cubic-bezier(0.22,1,0.36,1) both',
                    }}
                  >
                    <Plane style={{ width: 30, height: 30, color: 'var(--btn-primary-text)' }} />
                  </div>
                  <h1 style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 900,
                    fontSize: '2rem',
                    letterSpacing: '-0.04em',
                    margin: 0,
                    background: 'var(--btn-primary-bg)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    VoyaCore
                  </h1>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '6px 0 0', textAlign: 'center' }}>
                    Enterprise Workforce Travel & Logistics
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    marginBottom: '16px', padding: '12px 16px',
                    borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
                    color: '#fca5a5', fontSize: '0.8125rem',
                    animation: 'fadeSlideUp 0.3s ease both',
                  }}>
                    <ShieldAlert style={{ width: 16, height: 16, flexShrink: 0 }} />
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '7px' }}>
                      Corporate Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      style={{
                        width: '100%', padding: '12px 16px',
                        borderRadius: '12px', outline: 'none', boxSizing: 'border-box',
                        background: 'var(--input)', border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)', fontSize: '0.875rem',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '7px' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{
                          width: '100%', padding: '12px 44px 12px 16px',
                          borderRadius: '12px', outline: 'none', boxSizing: 'border-box',
                          background: 'var(--input)', border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)', fontSize: '0.875rem',
                          fontFamily: 'Inter, sans-serif',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
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
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '13px',
                      borderRadius: '12px', border: 'none', cursor: 'pointer',
                      background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)',
                      fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '0.9rem',
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
                      <><span>Sign In</span><ArrowRight size={16} /></>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div style={{ position: 'relative', margin: '20px 0' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%', height: '1px', background: 'var(--border-subtle)' }} />
                  </div>
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      padding: '0 10px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
                      textTransform: 'uppercase', color: 'var(--text-muted)',
                      background: 'var(--bg-glass)', backdropFilter: 'blur(8px)',
                    }}>Quick Access</span>
                  </div>
                </div>

                {/* Role cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {CREDENTIALS.map((cred, i) => (
                    <button
                      key={cred.email}
                      onClick={() => { setEmail(cred.email); setLoadingRole(cred.email); handleLogin(undefined, cred.email); }}
                      disabled={loading}
                      style={{
                        textAlign: 'left', padding: '10px 12px',
                        borderRadius: '12px', cursor: 'pointer',
                        background: 'var(--nav-hover-bg)',
                        border: '1px solid var(--border-subtle)',
                        fontFamily: 'Inter, sans-serif',
                        animation: `fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) ${0.3 + i * 0.05}s both`,
                        transition: 'border-color 0.2s, transform 0.2s, background 0.2s',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = cred.color + '60';
                        el.style.background = cred.color + '0e';
                        el.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = 'var(--border-subtle)';
                        el.style.background = 'var(--nav-hover-bg)';
                        el.style.transform = '';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px' }}>{cred.icon}</span>
                        {loadingRole === cred.email && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ color: cred.color, animation: 'spin-slow 0.8s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                            <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: cred.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cred.label}
                      </div>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cred.email}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>

          <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '16px' }}>
            VoyaCore — Enterprise Travel Management Platform
          </p>
        </div>
      </div>
    </div>
  );
}
