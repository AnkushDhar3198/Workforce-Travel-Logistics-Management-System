import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

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
    <Card className="text-left">
      <CardHeader className="border-b border-slate-800 pb-3 mb-4">
        <CardTitle>Active Travel Policies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.map((rule, idx) => (
          <div key={idx} className="p-4 bg-slate-900/40 border border-slate-850 rounded-lg flex justify-between items-start">
            <div className="space-y-1">
              <Badge variant="default" className="text-[9px] uppercase tracking-wider mb-1">{rule.ruleType}</Badge>
              <h4 className="font-extrabold text-white text-sm mt-1">{rule.value}</h4>
              <p className="text-xs text-slate-400">{rule.desc}</p>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{rule.region}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
