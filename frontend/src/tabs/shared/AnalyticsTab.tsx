import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

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
    <div className="space-y-8 text-left">
      {/* Metric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-5">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Spend (YTD)</span>
          <h4 className="text-2xl font-black text-white mt-1">$130,000</h4>
          <span className="text-[10px] text-green-400 font-semibold">&uarr; 14% vs Q1 baseline</span>
        </Card>
        <Card className="p-5">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Preferred Vendor Match</span>
          <h4 className="text-2xl font-black text-cyan-400 mt-1">92.4%</h4>
          <span className="text-[10px] text-green-400 font-semibold">9.2% negotiated leakage saved</span>
        </Card>
        <Card className="p-5">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Policy Compliance Rate</span>
          <h4 className="text-2xl font-black text-yellow-500 mt-1">87.5%</h4>
          <span className="text-[10px] text-slate-500 font-semibold">29 warning flags flagged</span>
        </Card>
        <Card className="p-5">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avg Reimbursement Speed</span>
          <h4 className="text-2xl font-black text-white mt-1">1.8 Days</h4>
          <span className="text-[10px] text-cyan-400 font-semibold">&darr; 3.2 days using OCR automation</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
        {/* Chart 1: Monthly Cost trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spend &amp; Policy Violation Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Legend />
                <Line type="monotone" dataKey="Spend" stroke="#0ea5e9" strokeWidth={3} />
                <Line type="monotone" dataKey="PolicyViolations" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Department budget distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Travel Cost Distribution by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3 pl-6">
              {deptData.map((d, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="font-semibold text-slate-350">{d.name}:</span>
                  <span className="text-slate-500 font-bold">${d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
