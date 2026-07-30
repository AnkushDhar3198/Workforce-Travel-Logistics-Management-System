import React, { useState } from 'react';
import { Plane, ShieldAlert } from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const credentials = [
    { label: 'Traveling Employee', email: 'employee@cbg.com' },
    { label: 'Approving Manager', email: 'manager@cbg.com' },
    { label: 'Travel Manager', email: 'travelmanager@cbg.com' },
    { label: 'Finance & Audit', email: 'finance@cbg.com' },
    { label: 'Security & Risk', email: 'security@cbg.com' },
    { label: 'Logistics Coordinator', email: 'logistics@cbg.com' },
    { label: 'Admin (System Logs)', email: 'admin@cbg.com' },
  ];

  const handleLogin = async (e?: React.FormEvent, selectedEmail?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    
    const targetEmail = selectedEmail || email;
    if (!targetEmail) {
      setError('Please select or input an email address.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed. Check credentials.');
      }

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
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#030712]">
      <div className="w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl border border-slate-800">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Plane className="w-10 h-10 animate-pulse" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-center text-white tracking-tight">VoyaCore</h2>
        <p className="text-sm text-center text-slate-400 mt-1 mb-6">Enterprise Workforce Travel &amp; Logistics Management System</p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <ShieldAlert className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Corporate Email</label>
            <Input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@cbg.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <Input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="px-2 text-slate-500 bg-[#030712]">Demo Accounts</span></div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {credentials.map((cred) => (
            <button
              key={cred.label}
              onClick={() => {
                setEmail(cred.email);
                handleLogin(undefined, cred.email);
              }}
              className="px-2 py-2 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 rounded text-left text-slate-300 transition-colors truncate cursor-pointer"
            >
              <div className="font-semibold text-cyan-400 truncate">{cred.label}</div>
              <div className="text-slate-500 truncate text-[10px]">{cred.email}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
