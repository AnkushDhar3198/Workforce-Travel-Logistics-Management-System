import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ShieldCheck, CheckCircle2, AlertTriangle, SlidersHorizontal, Layers, FileCode } from 'lucide-react';

export default function PolicyRulesTab() {
  const { authFetch } = useAuth();
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    const loadRules = async () => {
      try {
        const res = await authFetch(`${API_BASE}/policy-rules`);
        if (res.ok) {
          const list = await res.json();
          setRules(list);
        }
      } catch (err) {}
    };
    loadRules();
  }, []);

  const formatConditionSummary = (jsonStr?: string) => {
    if (!jsonStr) return 'No constraint parameters set.';
    try {
      const obj = JSON.parse(jsonStr);
      if (obj.max_daily_budget !== undefined) {
        return `🏨 Daily Hotel Rate Cap: $${Number(obj.max_daily_budget).toLocaleString('en-US', { minimumFractionDigits: 2 })} / night max`;
      }
      if (obj.min_days_advance !== undefined) {
        return `📅 Advance Booking Lead Time: Minimum ${obj.min_days_advance} days prior to departure`;
      }
      if (obj.requires_justification_above !== undefined) {
        return `✈️ Flight Fare Justification Threshold: Requires CTM approval above $${Number(obj.requires_justification_above).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      }
      return Object.entries(obj).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' • ');
    } catch {
      return jsonStr;
    }
  };

  const getRuleDetails = (ruleType: string) => {
    switch (ruleType) {
      case 'HOTEL_BUDGET':
        return { title: 'Hotel Daily Budget Cap', category: 'Lodging & Accommodation', icon: '🏨', color: '#0ea5e9' };
      case 'BOOKING_LEAD_TIME':
        return { title: 'Advance Booking Lead Time', category: 'Reservation Window', icon: '📅', color: '#6366f1' };
      case 'FLIGHT_CLASS':
        return { title: 'Flight Class & Fare Ceiling', category: 'Airfare Procurement', icon: '✈️', color: '#a855f7' };
      default:
        return { title: ruleType.replace(/_/g, ' '), category: 'Corporate Governance', icon: '🛡️', color: '#38bdf8' };
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in-up">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
            <span>Travel Policy Engine Rules</span>
          </h2>
          <p className="text-sm text-slate-400">View active policy compliance constraints and corporate guidelines enforced by the auto-booking engine.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1.5 bg-cyan-500/10 border-cyan-500/30 text-cyan-400 flex items-center gap-1.5 shadow-sm font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{rules.length || 3} Active Rules Enforced</span>
          </Badge>
        </div>
      </div>

      {/* 2. Top-level summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Policy Rules</p>
              <h4 className="text-lg font-black text-white mt-0.5">{rules.length || 3} Engine Rules</h4>
              <p className="text-[10px] text-emerald-400 font-bold">Auto-evaluation Active (100% SLA)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Policy Scope Region</p>
              <h4 className="text-lg font-black text-white mt-0.5">Global Enterprise</h4>
              <p className="text-[10px] text-slate-400">Applies across all 140+ corridors</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Engine Status</p>
              <h4 className="text-lg font-black text-white mt-0.5">Strict Auto-Enforcement</h4>
              <p className="text-[10px] text-emerald-400 font-bold">Real-time validation ON</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Rules List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Seeded System Policy Rules</h3>
          <span className="text-xs text-slate-400">Real-Time Evaluation Enabled</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(rules.length > 0 ? rules : [
            { id: 1, ruleType: 'HOTEL_BUDGET', region: 'GLOBAL', conditionJson: '{"max_daily_budget":300.0}' },
            { id: 2, ruleType: 'BOOKING_LEAD_TIME', region: 'GLOBAL', conditionJson: '{"min_days_advance":14}' },
            { id: 3, ruleType: 'FLIGHT_CLASS', region: 'GLOBAL', conditionJson: '{"requires_justification_above":2500.0}' }
          ]).map(rule => {
            const meta = getRuleDetails(rule.ruleType);
            return (
              <Card key={rule.id} className="bg-slate-900/60 border border-slate-800 p-5 space-y-4 shadow-xl hover:border-cyan-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{meta.icon}</span>
                      <div>
                        <h4 className="font-extrabold text-white text-base leading-tight">{meta.title}</h4>
                        <span className="text-[10.5px] text-slate-400 font-medium block">{meta.category}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9.5px] font-bold bg-slate-950/80 border-slate-700 text-cyan-400 px-2 py-0.5">
                      {rule.region || 'GLOBAL'}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 my-3">
                    <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                      {formatConditionSummary(rule.conditionJson)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-slate-500" />
                    <code className="text-indigo-300 font-mono text-[10px]">{rule.conditionJson}</code>
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
