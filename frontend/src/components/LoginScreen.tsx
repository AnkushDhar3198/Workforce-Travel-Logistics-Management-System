import React, { useState, useRef, useEffect } from 'react';
import { Plane, ShieldAlert, Eye, EyeOff, ArrowRight, Globe, Sparkles, Zap } from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Animated background mesh */}
      <div className="app-bg" aria-hidden>
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }}
      />

      {/* Main card */}
      <div
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)' }}
      >
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-default)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Top glow bar */}
          <div
            style={{
              height: '2px',
              background: 'var(--btn-primary-bg)',
              opacity: 0.8,
            }}
          />

          <div className="p-8">
            {/* Logo */}
            <div
              className="flex flex-col items-center mb-8"
              style={{ animationDelay: '0.1s' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-bounce-in"
                style={{
                  background: 'var(--btn-primary-bg)',
                  boxShadow: '0 8px 32px var(--accent-glow-strong), 0 0 0 1px var(--border-default)',
                }}
              >
                <Plane className="w-8 h-8" style={{ color: 'var(--btn-primary-text)' }} />
              </div>
              <h1
                className="text-3xl font-black tracking-tight text-gradient"
                style={{ fontFamily: 'Inter, sans-serif', animationDelay: '0.2s' }}
              >
                VoyaCore
              </h1>
              <p className="text-sm mt-1.5 text-center" style={{ color: 'var(--text-secondary)' }}>
                Enterprise Workforce Travel & Logistics
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-5 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-slide-up text-sm"
                style={{
                  background: 'rgba(239, 68, 68, 0.10)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#fca5a5',
                }}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Corporate Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'var(--input)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: 'var(--input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ fontSize: '0.9rem', letterSpacing: '0.025em' }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden
              >
                <div className="w-full h-px" style={{ background: 'var(--border-subtle)' }} />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="px-3 text-xs font-semibold uppercase tracking-widest"
                  style={{
                    background: 'var(--bg-glass)',
                    color: 'var(--text-muted)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Quick Access
                </span>
              </div>
            </div>

            {/* Demo role cards */}
            <div className="grid grid-cols-2 gap-2">
              {CREDENTIALS.map((cred, i) => (
                <button
                  key={cred.email}
                  onClick={() => {
                    setEmail(cred.email);
                    setLoadingRole(cred.email);
                    handleLogin(undefined, cred.email);
                  }}
                  disabled={loading}
                  className="animate-fade-slide-up text-left p-3 rounded-xl cursor-pointer transition-all group"
                  style={{
                    background: 'var(--nav-hover-bg)',
                    border: '1px solid var(--border-subtle)',
                    animationDelay: `${0.3 + i * 0.05}s`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = cred.color + '40';
                    (e.currentTarget as HTMLElement).style.background = cred.color + '08';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--nav-hover-bg)';
                    (e.currentTarget as HTMLElement).style.transform = '';
                  }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base">{cred.icon}</span>
                    {loadingRole === cred.email && (
                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: cred.color }}>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-xs font-bold truncate" style={{ color: cred.color }}>
                    {cred.label}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {cred.email}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-4"
          style={{ color: 'var(--text-muted)' }}
        >
          VoyaCore — Enterprise Travel Management Platform
        </p>
      </div>
    </div>
  );
}
