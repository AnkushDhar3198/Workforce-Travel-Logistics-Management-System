import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { BarChart3, DollarSign, Award, ShieldCheck, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export default function AnalyticsTab() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    setData([
      { name: 'Jan', Spend: 12000, PolicyViolations: 3 },
      { name: 'Feb', Spend: 19000, PolicyViolations: 5 },
      { name: 'Mar', Spend: 15000, PolicyViolations: 2 },
      { name: 'Apr', Spend: 28000, PolicyViolations: 9 },
      { name: 'May', Spend: 22000, PolicyViolations: 4 },
      { name: 'Jun', Spend: 34000, PolicyViolations: 6 },
    ]);
  }, []);

  const deptData = [
    { name: 'Sales & BD', value: 45000 },
    { name: 'Engineering', value: 18000 },
    { name: 'Marketing', value: 25000 },
    { name: 'Operations', value: 12000 }
  ];

  const COLORS = ['#0ea5e9', '#6366f1', '#a855f7', '#14b8a6'];

  return (
    <div className="space-y-6 text-left animate-fade-in-up">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-cyan-400" />
            <span>Reports &amp; Corporate ROI</span>
          </h2>
          <p className="text-sm text-slate-400">Analyze organization-wide travel expenditures, policy exception rates, and vendor SLA benchmarks.</p>
        </div>
      </div>

      {/* 2. Metric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850 p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider block">Total Spend (YTD)</span>
              <h4 className="text-2xl font-black text-white mt-1.5">$130,000</h4>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400"><DollarSign className="w-5 h-5" /></div>
          </div>
          <span className="text-[10px] text-emerald-450 font-bold block mt-2">&uarr; 14% vs Q1 baseline</span>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850 p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider block">Preferred Vendor Match</span>
              <h4 className="text-2xl font-black text-cyan-400 mt-1.5">92.4%</h4>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400"><Award className="w-5 h-5" /></div>
          </div>
          <span className="text-[10px] text-emerald-455 font-bold block mt-2">9.2% leakage saved</span>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850 p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider block">Policy Compliance</span>
              <h4 className="text-2xl font-black text-yellow-500 mt-1.5">87.5%</h4>
            </div>
            <div className="p-2.5 rounded-lg bg-yellow-500/10 text-yellow-500"><ShieldCheck className="w-5 h-5" /></div>
          </div>
          <span className="text-[10px] text-slate-500 font-bold block mt-2">29 warnings flagged</span>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850 p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider block">Avg Settlement Speed</span>
              <h4 className="text-2xl font-black text-white mt-1.5">1.8 Days</h4>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-450"><Clock className="w-5 h-5" /></div>
          </div>
          <span className="text-[10px] text-cyan-405 font-bold block mt-2">&darr; 3.2 days using OCR automation</span>
        </Card>
      </div>

      {/* 3. Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
        {/* Chart 1: Monthly Cost trends */}
        <Card className="bg-slate-900/40 border border-slate-850 shadow-lg">
          <CardHeader className="border-b border-slate-850 pb-3 mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
              Monthly Spend &amp; Policy Violation Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#121826', border: '1px solid #1f293d', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Spend" stroke="#0ea5e9" strokeWidth={3} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="PolicyViolations" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Department budget distribution */}
        <Card className="bg-slate-900/40 border border-slate-850 shadow-lg">
          <CardHeader className="border-b border-slate-850 pb-3 mb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
              Travel Cost Distribution by Department
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center p-4">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#121826', border: '1px solid #1f293d', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3 pl-6">
              {deptData.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-950/20 border border-slate-850 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="font-semibold text-slate-350">{d.name}</span>
                  </div>
                  <span className="text-white font-bold">${d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
