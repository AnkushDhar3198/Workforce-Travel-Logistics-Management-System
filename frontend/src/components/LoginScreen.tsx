import React, { useState, useRef, useEffect } from 'react';
import {
  Plane, ShieldAlert, Eye, EyeOff, ArrowRight, ArrowLeft, X, ChevronDown, Sparkles,
  Shield, Truck, DollarSign, CheckCircle2, BarChart3, Lock, Menu, User, MapPin,
  FileText, Heart, KeyRound, Building2, Briefcase, Phone, Globe, Calendar
} from 'lucide-react';
import { useAuth, API_BASE, BACKEND_URL } from '../context/AuthContext';
import { useTheme, THEMES, type ThemeId } from '../context/ThemeContext';
import Canvas3DBackground from './Canvas3DBackground';

const DEPARTMENTS = [
  'Sales', 'Engineering', 'Marketing', 'Finance', 'Human Resources',
  'Legal', 'Operations', 'Logistics', 'IT Operations', 'Security Operations',
  'Administration', 'Research & Development', 'Customer Success', 'Procurement',
];

const ROLES = [
  { value: 'TRAVELING_EMPLOYEE', label: 'Traveling Employee' },
  { value: 'APPROVING_MANAGER', label: 'Approving Manager' },
  { value: 'CORPORATE_TRAVEL_MANAGER', label: 'Corporate Travel Manager' },
  { value: 'FINANCE_PROCUREMENT', label: 'Finance & Procurement' },
  { value: 'SECURITY_RISK_OFFICER', label: 'Security & Risk Officer' },
  { value: 'LOGISTICS_COORDINATOR', label: 'Logistics Coordinator' },
  { value: 'ADMIN', label: 'Administrator' },
];

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Other'];

const REG_STEPS = [
  { label: 'Personal', icon: User },
  { label: 'Corporate', icon: Building2 },
  { label: 'Contact', icon: MapPin },
  { label: 'Travel Docs', icon: FileText },
  { label: 'Emergency', icon: Heart },
  { label: 'Security', icon: KeyRound },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '12px', outline: 'none', boxSizing: 'border-box',
  background: 'var(--input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '14px',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px',
};

export default function LoginScreen() {
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Multi-step registration state
  const [regStep, setRegStep] = useState(0);
  const [reg, setReg] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: '', bloodGroup: '', nationality: '',
    email: '', department: '', designation: '', role: 'TRAVELING_EMPLOYEE', managerId: '',
    phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '',
    passportNumber: '', passportExpiry: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
    password: '', confirmPassword: '',
  });

  // Countries from API
  const [countries, setCountries] = useState<{ name: string; code: string }[]>([]);

  // Navbar state
  const [activeDropdown, setActiveDropdown] = useState<'solutions' | 'autonomy' | null>(null);
  const [featureModal, setFeatureModal] = useState<'duty' | 'logistics' | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const dropdownTimerRef = useRef<any>(null);

  // Fetch countries on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/public/countries`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setCountries(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
        }
      })
      .catch(() => {
        // Fallback countries if API not available yet
        setCountries([
          { name: 'India', code: 'IN' }, { name: 'United States', code: 'US' },
          { name: 'United Kingdom', code: 'GB' }, { name: 'Germany', code: 'DE' },
          { name: 'France', code: 'FR' }, { name: 'Australia', code: 'AU' },
          { name: 'Canada', code: 'CA' }, { name: 'Japan', code: 'JP' },
          { name: 'Singapore', code: 'SG' }, { name: 'United Arab Emirates', code: 'AE' },
        ]);
      });
  }, []);

  const updateReg = (field: string, value: string) => setReg(prev => ({ ...prev, [field]: value }));

  const openLogin = () => {
    setAuthMode('login'); setError(''); setIsAuthModalOpen(true); setIsMobileNavOpen(false);
  };
  const openSignUp = () => {
    setAuthMode('signup'); setError(''); setRegStep(0); setIsAuthModalOpen(true); setIsMobileNavOpen(false);
  };

  const handleMouseEnterDropdown = (menu: 'solutions' | 'autonomy') => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setActiveDropdown(menu);
  };
  const handleMouseLeaveDropdown = () => {
    dropdownTimerRef.current = setTimeout(() => setActiveDropdown(null), 200);
  };

  // Validate current registration step
  const validateStep = (): string | null => {
    switch (regStep) {
      case 0:
        if (!reg.firstName.trim()) return 'First name is required';
        if (!reg.lastName.trim()) return 'Last name is required';
        if (!reg.gender) return 'Gender is required';
        if (!reg.nationality) return 'Nationality is required';
        return null;
      case 1:
        if (!reg.email.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email)) return 'Invalid email format';
        if (!reg.department) return 'Department is required';
        if (!reg.designation.trim()) return 'Designation is required';
        if (!reg.role) return 'Role is required';
        return null;
      case 2:
        if (!reg.phone.trim()) return 'Phone number is required';
        if (!reg.addressLine1.trim()) return 'Address is required';
        if (!reg.city.trim()) return 'City is required';
        if (!reg.state.trim()) return 'State is required';
        if (!reg.postalCode.trim()) return 'Postal code is required';
        if (!reg.country) return 'Country is required';
        return null;
      case 3:
        return null; // Travel docs are optional
      case 4:
        if (!reg.emergencyContactName.trim()) return 'Emergency contact name is required';
        if (!reg.emergencyContactPhone.trim()) return 'Emergency contact phone is required';
        if (!reg.emergencyContactRelation) return 'Relationship is required';
        return null;
      case 5:
        if (!reg.password) return 'Password is required';
        if (reg.password.length < 8) return 'Password must be at least 8 characters';
        if (reg.password !== reg.confirmPassword) return 'Passwords do not match';
        return null;
      default: return null;
    }
  };

  const handleNextStep = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setRegStep(s => Math.min(s + 1, REG_STEPS.length - 1));
  };

  const handlePrevStep = () => {
    setError('');
    setRegStep(s => Math.max(s - 1, 0));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) { setError('Please enter your email'); return; }
    if (!loginPassword) { setError('Please enter your password'); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Authentication failed. Check your credentials.');
      }
      const data = await response.json();
      const userRes = await fetch(`${API_BASE}/auth/me`, { headers: { 'Authorization': `Bearer ${data.token}` } });
      const userDetail = await userRes.json();
      login(data.token, userDetail);
    } catch (err: any) {
      setError(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      const payload: any = {
        firstName: reg.firstName, lastName: reg.lastName,
        dateOfBirth: reg.dateOfBirth || null, gender: reg.gender,
        bloodGroup: reg.bloodGroup || null, nationality: reg.nationality,
        email: reg.email, department: reg.department,
        designation: reg.designation, role: reg.role,
        managerId: reg.managerId ? parseInt(reg.managerId) : null,
        phone: reg.phone, addressLine1: reg.addressLine1,
        addressLine2: reg.addressLine2 || null, city: reg.city,
        state: reg.state, postalCode: reg.postalCode, country: reg.country,
        passportNumber: reg.passportNumber || null,
        passportExpiry: reg.passportExpiry || null,
        emergencyContactName: reg.emergencyContactName,
        emergencyContactPhone: reg.emergencyContactPhone,
        emergencyContactRelation: reg.emergencyContactRelation,
        password: reg.password,
      };

      const regRes = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!regRes.ok) {
        const errData = await regRes.json().catch(() => null);
        const errMsg = errData?.message || errData?.errors?.map((e: any) => e.defaultMessage).join(', ') || 'Registration failed.';
        throw new Error(errMsg);
      }
      const data = await regRes.json();
      const userRes = await fetch(`${API_BASE}/auth/me`, { headers: { 'Authorization': `Bearer ${data.token}` } });
      const userDetail = await userRes.json();
      login(data.token, userDetail);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const getPasswordStrength = (pw: string): { level: number; label: string; color: string } => {
    if (!pw) return { level: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#f97316' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#eab308' };
    if (score <= 4) return { level: 4, label: 'Strong', color: '#22c55e' };
    return { level: 5, label: 'Excellent', color: '#06b6d4' };
  };

  const renderRegStep = () => {
    switch (regStep) {
      case 0: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input style={inputStyle} value={reg.firstName} onChange={e => updateReg('firstName', e.target.value)} placeholder="John" />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input style={inputStyle} value={reg.lastName} onChange={e => updateReg('lastName', e.target.value)} placeholder="Doe" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Date of Birth</label>
            <input type="date" style={inputStyle} value={reg.dateOfBirth} onChange={e => updateReg('dateOfBirth', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Gender *</label>
              <select style={selectStyle} value={reg.gender} onChange={e => updateReg('gender', e.target.value)}>
                <option value="">Select...</option>
                {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Blood Group</label>
              <select style={selectStyle} value={reg.bloodGroup} onChange={e => updateReg('bloodGroup', e.target.value)}>
                <option value="">Select...</option>
                {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Nationality *</label>
            <select style={selectStyle} value={reg.nationality} onChange={e => updateReg('nationality', e.target.value)}>
              <option value="">Select Country...</option>
              {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>
      );
      case 1: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>Corporate Email *</label>
            <input type="email" style={inputStyle} value={reg.email} onChange={e => updateReg('email', e.target.value)} placeholder="john.doe@company.com" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Department *</label>
              <select style={selectStyle} value={reg.department} onChange={e => updateReg('department', e.target.value)}>
                <option value="">Select...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Role *</label>
              <select style={selectStyle} value={reg.role} onChange={e => updateReg('role', e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Designation / Job Title *</label>
            <input style={inputStyle} value={reg.designation} onChange={e => updateReg('designation', e.target.value)} placeholder="e.g. Senior Sales Executive" />
          </div>
          <div>
            <label style={labelStyle}>Reporting Manager ID (Optional)</label>
            <input type="number" style={inputStyle} value={reg.managerId} onChange={e => updateReg('managerId', e.target.value)} placeholder="e.g. 1" />
          </div>
        </div>
      );
      case 2: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>Phone Number *</label>
            <input type="tel" style={inputStyle} value={reg.phone} onChange={e => updateReg('phone', e.target.value)} placeholder="+91-9876543210" />
          </div>
          <div>
            <label style={labelStyle}>Address Line 1 *</label>
            <input style={inputStyle} value={reg.addressLine1} onChange={e => updateReg('addressLine1', e.target.value)} placeholder="Street address" />
          </div>
          <div>
            <label style={labelStyle}>Address Line 2</label>
            <input style={inputStyle} value={reg.addressLine2} onChange={e => updateReg('addressLine2', e.target.value)} placeholder="Apt, Suite (optional)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>City *</label>
              <input style={inputStyle} value={reg.city} onChange={e => updateReg('city', e.target.value)} placeholder="Mumbai" />
            </div>
            <div>
              <label style={labelStyle}>State *</label>
              <input style={inputStyle} value={reg.state} onChange={e => updateReg('state', e.target.value)} placeholder="Maharashtra" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Postal Code *</label>
              <input style={inputStyle} value={reg.postalCode} onChange={e => updateReg('postalCode', e.target.value)} placeholder="400001" />
            </div>
            <div>
              <label style={labelStyle}>Country *</label>
              <select style={selectStyle} value={reg.country} onChange={e => updateReg('country', e.target.value)}>
                <option value="">Select...</option>
                {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      );
      case 3: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--accent-primary)' }}>Optional:</strong> Passport details enable international travel document validation and automated visa compliance checks.
          </div>
          <div>
            <label style={labelStyle}>Passport Number</label>
            <input style={inputStyle} value={reg.passportNumber} onChange={e => updateReg('passportNumber', e.target.value)} placeholder="e.g. P-984201948" />
          </div>
          <div>
            <label style={labelStyle}>Passport Expiry Date</label>
            <input type="date" style={inputStyle} value={reg.passportExpiry} onChange={e => updateReg('passportExpiry', e.target.value)} />
          </div>
        </div>
      );
      case 4: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: '#f87171' }}>Required:</strong> Emergency contact details are mandatory for duty-of-care compliance and traveler safety protocols.
          </div>
          <div>
            <label style={labelStyle}>Emergency Contact Name *</label>
            <input style={inputStyle} value={reg.emergencyContactName} onChange={e => updateReg('emergencyContactName', e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label style={labelStyle}>Emergency Contact Phone *</label>
            <input type="tel" style={inputStyle} value={reg.emergencyContactPhone} onChange={e => updateReg('emergencyContactPhone', e.target.value)} placeholder="+91-9876543210" />
          </div>
          <div>
            <label style={labelStyle}>Relationship *</label>
            <select style={selectStyle} value={reg.emergencyContactRelation} onChange={e => updateReg('emergencyContactRelation', e.target.value)}>
              <option value="">Select...</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      );
      case 5: {
        const strength = getPasswordStrength(reg.password);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '38px' }}
                  value={reg.password} onChange={e => updateReg('password', e.target.value)} placeholder="Minimum 8 characters"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {reg.password && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= strength.level ? strength.color : 'var(--border-default)', transition: 'all 0.3s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <input type="password" style={inputStyle} value={reg.confirmPassword} onChange={e => updateReg('confirmPassword', e.target.value)} placeholder="Re-enter password" />
              {reg.confirmPassword && reg.password !== reg.confirmPassword && (
                <span style={{ fontSize: '10px', color: '#ef4444', marginTop: '3px', display: 'block' }}>Passwords do not match</span>
              )}
            </div>
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
      <Canvas3DBackground />

      {/* TOP NAVIGATION BAR */}
      <header style={{
        position: 'relative', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)', background: 'var(--header-bg)', boxSizing: 'border-box', width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => { setIsAuthModalOpen(false); setFeatureModal(null); setIsMobileNavOpen(false); }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--btn-primary-bg)', boxShadow: '0 4px 16px var(--accent-glow)', flexShrink: 0 }}>
            <Plane size={18} style={{ color: 'var(--btn-primary-text)' }} />
          </div>
          <div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.03em', display: 'block', lineHeight: 1.1 }}>VOYACORE</span>
            <span style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-primary)', display: 'block' }}>TRAVEL & LOGISTICS</span>
          </div>
        </div>

        {/* Center Nav */}
        <nav className="hidden lg:flex" style={{ alignItems: 'center', gap: '24px', position: 'relative' }}>
          <div onMouseEnter={() => handleMouseEnterDropdown('solutions')} onMouseLeave={handleMouseLeaveDropdown} style={{ position: 'relative', padding: '8px 0', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: activeDropdown === 'solutions' ? 'var(--accent-primary)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
              <span>Solutions</span>
              <ChevronDown size={14} style={{ transform: activeDropdown === 'solutions' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {activeDropdown === 'solutions' && (
              <div style={{ position: 'absolute', top: '100%', left: '-20px', width: '520px', padding: '18px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', backdropFilter: 'blur(28px) saturate(180%)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', zIndex: 50, animation: 'fadeSlideUp 0.2s ease both' }}>
                {[
                  { icon: Plane, color: '#22d3ee', bg: 'rgba(34,211,238,0.15)', title: 'Workforce Mobility', desc: 'Flight booking & PNR digital boarding passes.' },
                  { icon: CheckCircle2, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', title: 'Manager Approvals', desc: 'Budget authorization & compliance routing.' },
                  { icon: DollarSign, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', title: 'Expense Auditing', desc: 'OCR receipt parsing & per-diem rules.' },
                  { icon: Truck, color: '#fb923c', bg: 'rgba(251,146,60,0.15)', title: 'Cargo Logistics', desc: 'Air freight manifests & customs clearance.' },
                ].map((item, i) => (
                  <div key={i} onClick={openLogin} style={{ padding: '12px', borderRadius: '14px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={14} /></div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>{item.title}</span>
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div onMouseEnter={() => handleMouseEnterDropdown('autonomy')} onMouseLeave={handleMouseLeaveDropdown} style={{ position: 'relative', padding: '8px 0', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: activeDropdown === 'autonomy' ? 'var(--accent-primary)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
              <span>Platform Autonomy</span>
              <ChevronDown size={14} style={{ transform: activeDropdown === 'autonomy' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {activeDropdown === 'autonomy' && (
              <div style={{ position: 'absolute', top: '100%', left: '-20px', width: '520px', padding: '18px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', backdropFilter: 'blur(28px) saturate(180%)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', zIndex: 50, animation: 'fadeSlideUp 0.2s ease both' }}>
                {[
                  { icon: Sparkles, color: '#34d399', bg: 'rgba(52,211,153,0.15)', title: 'Level 5 AI Engine', desc: 'Autonomous rebooking & smart policy enforcement.' },
                  { icon: Shield, color: '#f87171', bg: 'rgba(248,113,113,0.15)', title: 'Duty of Care GPS', desc: 'Traveler heatmap & 24/7 emergency dispatch.' },
                  { icon: Lock, color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', title: 'Audit & Governance', desc: 'Security event logs & corporate RBAC.' },
                  { icon: BarChart3, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', title: 'Spend Analytics', desc: 'Executive budget & discount analytics.' },
                ].map((item, i) => (
                  <div key={i} onClick={openLogin} style={{ padding: '12px', borderRadius: '14px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={14} /></div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>{item.title}</span>
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div onClick={() => setFeatureModal('duty')} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', transition: 'color 0.2s' }}><span>Duty of Care</span></div>
          <div onClick={() => setFeatureModal('logistics')} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', transition: 'color 0.2s' }}><span>Logistics Manifest</span></div>
        </nav>

        {/* Right Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="hidden sm:flex" style={{ alignItems: 'center', gap: '3px', marginRight: '4px' }}>
            {THEMES.map(t => (
              <button key={t.id} onClick={() => setTheme(t.id as ThemeId)} title={t.name}
                style={{ padding: '4px 7px', borderRadius: '100px', border: '1px solid', borderColor: theme === t.id ? 'var(--border-active)' : 'transparent', background: theme === t.id ? 'var(--nav-active-bg)' : 'transparent', color: theme === t.id ? 'var(--accent-primary)' : 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <span>{t.emoji}</span>
              </button>
            ))}
          </div>
          <button onClick={openLogin} style={{ padding: '8px 15px', borderRadius: '100px', border: '1px solid var(--border-default)', background: 'var(--nav-hover-bg)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease', backdropFilter: 'blur(12px)', whiteSpace: 'nowrap' }}>Log In</button>
          <button onClick={openSignUp} style={{ padding: '8px 16px', borderRadius: '100px', border: 'none', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 16px var(--accent-glow)', whiteSpace: 'nowrap' }}>Sign Up</button>
          <button onClick={() => setIsMobileNavOpen(v => !v)} className="flex lg:hidden"
            style={{ padding: '8px', borderRadius: '10px', border: '1px solid var(--border-default)', background: 'var(--nav-hover-bg)', color: 'var(--text-primary)', cursor: 'pointer' }}>
            {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {isMobileNavOpen && (
        <div className="lg:hidden" style={{ position: 'fixed', top: '56px', left: 0, right: 0, zIndex: 35, padding: '20px', background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)', backdropFilter: 'blur(32px) saturate(180%)', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.4)', animation: 'fadeSlideDown 0.25s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Select Theme</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t.id as ThemeId)}
                  style={{ padding: '6px 10px', borderRadius: '100px', border: '1px solid', borderColor: theme === t.id ? 'var(--border-active)' : 'transparent', background: theme === t.id ? 'var(--nav-active-bg)' : 'transparent', fontSize: '12px', cursor: 'pointer' }}>{t.emoji}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setIsMobileNavOpen(false); setFeatureModal('duty'); }} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-default)', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>🛡️ Duty of Care</button>
            <button onClick={() => { setIsMobileNavOpen(false); setFeatureModal('logistics'); }} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'var(--nav-hover-bg)', border: '1px solid var(--border-default)', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>📦 Cargo Manifest</button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={openLogin} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border-default)', background: 'var(--nav-hover-bg)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>Log In</button>
            <button onClick={openSignUp} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--btn-primary-bg)', fontSize: '13px', fontWeight: 800, color: 'var(--btn-primary-text)', cursor: 'pointer' }}>Sign Up</button>
          </div>
        </div>
      )}

      {/* HERO */}
      <main style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', boxSizing: 'border-box', overflowY: 'auto', textAlign: 'center' }}>
        <div style={{ maxWidth: '820px', width: '100%', margin: 'auto 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', background: 'var(--nav-active-bg)', border: '1px solid var(--nav-active-border)', color: 'var(--accent-primary)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '18px', maxWidth: '90vw', animation: 'fadeSlideDown 0.6s ease both' }}>
            <Sparkles size={13} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>LEVEL 5 HUMAN + AI AUTONOMY MODEL</span>
          </div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 'clamp(1.75rem, 5.5vw, 3.4rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)', margin: '0 0 16px', lineHeight: 1.12, wordBreak: 'break-word' }}>
            Next-Gen Workforce Travel & Logistics Management
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.15rem)', color: 'var(--text-secondary)', margin: '0 auto 28px', maxWidth: '680px', lineHeight: 1.5 }}>
            Unified enterprise platform for real-time travel itineraries, border control clearance, automated expense auditing, custom logistics manifests, and duty-of-care security.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <button onClick={openLogin} style={{ padding: '13px 28px', borderRadius: '100px', border: 'none', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 8px 32px var(--accent-glow-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.22s ease', minWidth: '200px' }}>
              <span>Sign In to Portal</span><ArrowRight size={17} />
            </button>
            <button onClick={openSignUp} style={{ padding: '13px 26px', borderRadius: '100px', border: '1px solid var(--border-default)', background: 'var(--nav-hover-bg)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', backdropFilter: 'blur(16px)', transition: 'all 0.22s ease', minWidth: '180px' }}>
              Create Account
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 20, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', backdropFilter: 'blur(20px)', background: 'var(--header-bg)' }}>
        <div>Copyright © 2026 VoyaCore Enterprise Inc.</div>
        <div style={{ display: 'flex', gap: '14px' }}>
          <span>Privacy Policy</span><span>Terms</span><span>Security</span>
        </div>
      </footer>

      {/* FEATURE MODALS */}
      {featureModal === 'duty' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'transparent', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.2s ease both' }}
          onClick={(e) => { if (e.target === e.currentTarget) setFeatureModal(null); }}>
          <div style={{ width: 'calc(100vw - 32px)', maxWidth: '520px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '20px', backdropFilter: 'blur(32px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(248,113,113,0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={18} /></div>
                <div><h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Duty of Care & Security</h3><span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Global Real-Time Risk Engine</span></div>
              </div>
              <button onClick={() => setFeatureModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>Protects corporate travelers with real-time GPS heatmaps, automated travel warning alerts, and instant 24/7 SOS dispatch with emergency responder coordination.</p>
            <button onClick={() => { setFeatureModal(null); openLogin(); }} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}>Sign In to Access →</button>
          </div>
        </div>
      )}
      {featureModal === 'logistics' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'transparent', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.2s ease both' }}
          onClick={(e) => { if (e.target === e.currentTarget) setFeatureModal(null); }}>
          <div style={{ width: 'calc(100vw - 32px)', maxWidth: '520px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '20px', backdropFilter: 'blur(32px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(251,146,60,0.15)', color: '#fb923c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Truck size={18} /></div>
                <div><h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Supply Cargo Logistics</h3><span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Air Cargo & Customs Manifests</span></div>
              </div>
              <button onClick={() => setFeatureModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>Tracks international cargo manifests, custom clearance documents, bills of lading, and automated freight handler pipeline statuses in real-time.</p>
            <button onClick={() => { setFeatureModal(null); openLogin(); }} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}>Sign In to Access →</button>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'transparent', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', animation: 'fadeIn 0.25s ease both' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsAuthModalOpen(false); }}>
          <div style={{ width: 'calc(100vw - 24px)', maxWidth: authMode === 'signup' ? '520px' : '440px', maxHeight: '90vh', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', backdropFilter: 'blur(32px) saturate(180%)', overflowY: 'auto', position: 'relative', animation: 'popIn 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'var(--btn-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plane size={14} style={{ color: 'var(--btn-primary-text)' }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {authMode === 'login' ? 'Log In to VoyaCore' : 'Employee Registration'}
                </span>
              </div>
              <button onClick={() => setIsAuthModalOpen(false)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'var(--nav-hover-bg)', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ padding: '18px 20px 20px' }}>
              {/* Tab Toggle */}
              <div style={{ display: 'flex', borderRadius: '12px', background: 'var(--nav-hover-bg)', padding: '3px', marginBottom: '14px' }}>
                <button onClick={() => { setAuthMode('login'); setError(''); }} style={{ flex: 1, padding: '7px', borderRadius: '10px', border: 'none', background: authMode === 'login' ? 'var(--card-bg)' : 'transparent', color: authMode === 'login' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}>Log In</button>
                <button onClick={() => { setAuthMode('signup'); setError(''); setRegStep(0); }} style={{ flex: 1, padding: '7px', borderRadius: '10px', border: 'none', background: authMode === 'signup' ? 'var(--card-bg)' : 'transparent', color: authMode === 'signup' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}>Sign Up</button>
              </div>

              {/* Error */}
              {error && (
                <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '0.78rem', fontWeight: 600 }}>
                  <ShieldAlert size={14} /><span>{error}</span>
                </div>
              )}

              {authMode === 'login' ? (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Corporate Email</label>
                    <input type="email" style={inputStyle} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="name@company.com" />
                  </div>
                  <div>
                    <label style={labelStyle}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '38px' }} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', fontWeight: 800, fontSize: '0.88rem', boxShadow: '0 4px 16px var(--accent-glow)', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {loading ? 'Authenticating...' : 'Sign In to Portal'}
                  </button>
                </form>
              ) : (
                <div>
                  {/* Step Progress Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '16px' }}>
                    {REG_STEPS.map((step, i) => {
                      const StepIcon = step.icon;
                      const isActive = i === regStep;
                      const isComplete = i < regStep;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: isComplete ? 'pointer' : 'default' }}
                          onClick={() => { if (isComplete) { setRegStep(i); setError(''); } }}>
                          <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: isComplete ? 'var(--accent-primary)' : isActive ? 'var(--accent-primary)' : 'var(--border-default)', opacity: isActive ? 0.5 : 1, transition: 'all 0.3s' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <StepIcon size={10} style={{ color: isActive || isComplete ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                            <span style={{ fontSize: '9px', fontWeight: 700, color: isActive || isComplete ? 'var(--accent-primary)' : 'var(--text-muted)', letterSpacing: '0.05em' }}>{step.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Step Content */}
                  <div style={{ minHeight: '200px' }}>
                    {renderRegStep()}
                  </div>

                  {/* Step Navigation */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    {regStep > 0 && (
                      <button onClick={handlePrevStep} style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '1px solid var(--border-default)', background: 'var(--nav-hover-bg)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <ArrowLeft size={15} /> Back
                      </button>
                    )}
                    {regStep < REG_STEPS.length - 1 ? (
                      <button onClick={handleNextStep} style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 16px var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        Continue <ArrowRight size={15} />
                      </button>
                    ) : (
                      <button onClick={handleRegisterSubmit} disabled={loading} style={{ flex: 2, padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 16px var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
