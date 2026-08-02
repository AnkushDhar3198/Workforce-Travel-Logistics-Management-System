import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ShieldCheck } from 'lucide-react';

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
          <Badge variant="outline" className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-355 flex items-center gap-1.5 shadow-sm">
            <span>Rules Active: {rules.length}</span>
          </Badge>
        </div>
      </div>

      {/* 2. Top-level summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Active Rules</p>
              <h4 className="text-lg font-black text-white mt-0.5">{rules.length} Engine Rules</h4>
              <p className="text-[10px] text-slate-500">Auto-booking evaluation active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-405">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Scope Region</p>
              <h4 className="text-lg font-black text-white mt-0.5">Global Master</h4>
              <p className="text-[10px] text-slate-500">Applies across all departments</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-450">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Engine Status</p>
              <h4 className="text-lg font-black text-white mt-0.5">Active & Enforcement</h4>
              <p className="text-[10px] text-emerald-400">Real-time validation ON</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Rules List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350">Seeded System Policy Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map(rule => (
            <Card key={rule.id} className="bg-slate-900/40 border border-slate-850 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-cyan-400 text-sm">{rule.ruleType}</span>
                <Badge variant="outline" className="text-[9px] bg-slate-950 border-slate-800">{rule.region}</Badge>
              </div>
              <p className="text-xs text-slate-300">Condition JSON: <code className="text-xs text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">{rule.conditionJson}</code></p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
