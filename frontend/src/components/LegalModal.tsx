import React, { useState } from 'react';
import { Shield, FileText, Lock, X, Search, CheckCircle2, ShieldAlert, Key, Globe, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type LegalTabType = 'privacy' | 'terms' | 'security';

interface LegalModalProps {
  initialTab?: LegalTabType;
  onClose: () => void;
}

export default function LegalModal({ initialTab = 'privacy', onClose }: LegalModalProps) {
  const { themeData } = useTheme();
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  const renderPrivacyContent = () => (
    <div className="space-y-4 text-xs leading-relaxed text-slate-300">
      <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-start gap-3">
        <Shield className="w-5 h-5 shrink-0 text-cyan-400 mt-0.5" />
        <div>
          <h4 className="font-extrabold text-white text-xs">GDPR & CCPA Enterprise Data Sovereignty</h4>
          <p className="text-[11px] mt-0.5 text-cyan-200/90">
            VoyaCore processes all workforce travel, location, and expense data under strict EU-US Data Privacy Framework and CCPA compliance.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="font-black text-white uppercase tracking-wider text-[11px] text-cyan-400">1. Duty of Care Location Tracking Policy</h5>
        <p>
          GPS location tracking is activated strictly when an employee is on an active approved corporate travel itinerary. Location data is encrypted in transit and at rest using AES-256-GCM. Satellite pings are stored for a maximum of 30 days and are never sold or shared with third-party advertisers.
        </p>

        <h5 className="font-black text-white uppercase tracking-wider text-[11px] text-cyan-400">2. Travel Documents & Passport Vault Security</h5>
        <p>
          Passports, visas, and flight booking numbers uploaded to the VoyaCore Travel Vault are segmented using isolated zero-trust database schemas. Issuing authority details are audited continuously against corporate security compliance mandates.
        </p>

        <h5 className="font-black text-white uppercase tracking-wider text-[11px] text-cyan-400">3. Employee Right to Erasure (Data Portability)</h5>
        <p>
          Employees reserve the right to request exported copies of personal expense claims and travel logs. Personal identification records can be anonymized upon employment termination in accordance with corporate retention schedules.
        </p>
      </div>
    </div>
  );

  const renderTermsContent = () => (
    <div className="space-y-4 text-xs leading-relaxed text-slate-300">
      <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-start gap-3">
        <FileText className="w-5 h-5 shrink-0 text-indigo-400 mt-0.5" />
        <div>
          <h4 className="font-extrabold text-white text-xs">Enterprise Master Services Agreement (SLA 99.99%)</h4>
          <p className="text-[11px] mt-0.5 text-indigo-200/90">
            By accessing VoyaCore Workforce Travel & Logistics Management System, corporate users agree to compliance-driven booking protocols.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="font-black text-white uppercase tracking-wider text-[11px] text-indigo-400">1. Autonomous Rebooking & Policy Engine Delegation</h5>
        <p>
          VoyaCore Smart Rebooking Protocol authorizes automated travel modifications during emergency cancellations or severe risk events up to the pre-approved corporate threshold ($2,500 USD).
        </p>

        <h5 className="font-black text-white uppercase tracking-wider text-[11px] text-indigo-400">2. Expense Receipt Validation & Fraud Prevention</h5>
        <p>
          All submitted expense receipts undergo automated OCR verification. Submission of fraudulent receipts, duplicate claims, or non-accredited vendor invoices will trigger immediate account escalation to Corporate Risk & Finance.
        </p>

        <h5 className="font-black text-white uppercase tracking-wider text-[11px] text-indigo-400">3. Corporate Travel Desk SLA</h5>
        <p>
          Logistics shipments, ATA Carnets, and customs clearance documents must be submitted at least 48 hours prior to international deployment to guarantee carrier pickup.
        </p>
      </div>
    </div>
  );

  const renderSecurityContent = () => (
    <div className="space-y-4 text-xs leading-relaxed text-slate-300">
      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-start gap-3">
        <Lock className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
        <div>
          <h4 className="font-extrabold text-white text-xs">SOC-2 Type II & ISO 27001 Certified Security</h4>
          <p className="text-[11px] mt-0.5 text-emerald-200/90">
            VoyaCore infrastructure enforces zero-trust architecture, TLS 1.3 transport encryption, and automated audit trail logging.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="font-black text-white uppercase tracking-wider text-[11px] text-emerald-400">1. Authentication & Role-Based Access Control (RBAC)</h5>
        <p>
          User sessions are secured via short-lived JWT tokens and 256-Bit SSL encryption. Strict role segregation enforces distinct data visibility across Employees, Managers, Travel Desks, Finance, and Security Risk Officers.
        </p>

        <h5 className="font-black text-white uppercase tracking-wider text-[11px] text-emerald-400">2. Emergency SOS Satellite Protocol</h5>
        <p>
          The 24/7 SOS Panic Button initiates high-priority encrypted WebSockets and Server-Sent Events (SSE) directly to Security Command Centers and global response handlers.
        </p>

        <h5 className="font-black text-white uppercase tracking-wider text-[11px] text-emerald-400">3. Continuous Penetration Testing & Vulnerability Scans</h5>
        <p>
          Automated dependency scanning, SQL injection prevention, and daily API fuzzing ensure zero unauthorized data leaks across enterprise corporate tenants.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-pop-in"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          color: 'var(--text-primary)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-black">
              {activeTab === 'privacy' ? <Shield size={20} /> : activeTab === 'terms' ? <FileText size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">VoyaCore Governance & Legal</h3>
              <p className="text-[11px] text-slate-400 font-medium">Enterprise Compliance, Data Privacy & Security Framework</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border text-slate-400 hover:text-white transition-colors"
            style={{ background: 'var(--nav-hover-bg)', borderColor: 'var(--border-subtle)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-4 pb-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(0,0,0,0.15)' }}>
          {[
            { id: 'privacy', label: 'Privacy Policy', icon: Shield },
            { id: 'terms', label: 'Terms of Service', icon: FileText },
            { id: 'security', label: 'Security Architecture', icon: Lock },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as LegalTabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-5 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          {activeTab === 'privacy' && renderPrivacyContent()}
          {activeTab === 'terms' && renderTermsContent()}
          {activeTab === 'security' && renderSecurityContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between bg-black/20" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Updated August 2026 • Version 4.2 Enterprise</span>
          </div>
          <button
            onClick={() => {
              alert(`Downloaded VoyaCore_${activeTab.toUpperCase()}_AGREEMENT_2026.pdf`);
            }}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer text-slate-200 hover:text-white transition-colors"
            style={{ background: 'var(--nav-hover-bg)', borderColor: 'var(--border-subtle)' }}
          >
            <Download size={13} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
