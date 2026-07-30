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
        await authFetch(`${API_BASE}/admin/audit-logs`); // mock fetch to trigger active loading
        setRules([
          { ruleType: 'HOTEL_BUDGET', value: '$300.00 / night', desc: 'Regional hotel budget limits applied global standard.', region: 'GLOBAL' },
          { ruleType: 'BOOKING_LEAD_TIME', value: '14 Days minimum', desc: 'Flights must be booked at least 14 days in advance to capture discount tariffs.', region: 'GLOBAL' },
          { ruleType: 'FLIGHT_CLASS', value: 'Business class > 6 hrs flight time', desc: 'Executive flight class requires justification for durations below 6 hours.', region: 'GLOBAL' }
        ]);
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
              <span className="text-lg font-extrabold">⚖️</span>
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Enforcement Scope</p>
              <h4 className="text-lg font-black text-white mt-0.5">Global Organization</h4>
              <p className="text-[10px] text-slate-500">Applies to all department codes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-450">
              <span className="text-lg font-extrabold">🛡️</span>
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Auto-Audit Rate</p>
              <h4 className="text-lg font-black text-white mt-0.5">100%</h4>
              <p className="text-[10px] text-cyan-405">No-touch compliance filtering</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 12-Column Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* Rules List - span 8 */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Active Travel Policies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.map((rule, idx) => (
                <div key={idx} className="p-4 bg-slate-950/20 border border-slate-850 rounded-xl flex justify-between items-start hover:border-cyan-500/20 transition-all">
                  <div className="space-y-1">
                    <Badge variant="default" className="text-[9px] uppercase tracking-wider mb-1 bg-cyan-600/10 text-cyan-400 border border-cyan-500/20">
                      {rule.ruleType}
                    </Badge>
                    <h4 className="font-extrabold text-white text-sm mt-1">{rule.value}</h4>
                    <p className="text-xs text-slate-400">{rule.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                    {rule.region}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Override / Guidelines Sidebar - span 4 */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-855 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-355">
                Exception Overrides Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-400">
              <p>When a travel request triggers warning flags (e.g. Budget Exceeded, Late Booking):</p>
              
              <div className="relative border-l border-slate-800 pl-4 ml-2 space-y-4">
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <div className="font-bold text-white text-[10px] uppercase">1. Violation Detected</div>
                  <p className="text-[11px] text-slate-400">Auto-detected warnings are attached to the travel record.</p>
                </div>
                
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <div className="font-bold text-white text-[10px] uppercase">2. Manager Override</div>
                  <p className="text-[11px] text-slate-400">Approving manager must supply decision justification comments.</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                  <div className="font-bold text-white text-[10px] uppercase">3. Audit Trail Logging</div>
                  <p className="text-[11px] text-slate-400">The override decision is logged in the immutable system logs.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
