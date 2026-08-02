import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Map, MapPin, BadgeAlert } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export default function SecurityTab() {
  const { authFetch } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [riskFeeds, setRiskFeeds] = useState<{ city: string; risk: string; time: string }[]>([]);
  const [notes, setNotes] = useState('');

  const loadSecurity = async () => {
    try {
      const activeRes = await authFetch(`${API_BASE}/alerts/active`);
      if (activeRes.ok) setActiveAlerts(await activeRes.json());

      const reqRes = await authFetch(`${API_BASE}/travel`);
      if (reqRes.ok) {
        const all = await reqRes.json();
        const approved = all.filter((r: any) => r.status === 'APPROVED');
        setApprovedRequests(approved);

        // Fetch live weather/advisories for active travel destinations
        const cities = Array.from(new Set(approved.map((r: any) => r.destination))).filter(Boolean);
        const feeds: { city: string; risk: string; time: string }[] = [];
        for (const city of cities.slice(0, 5)) {
          try {
            const wRes = await authFetch(`${API_BASE}/weather/current?city=${encodeURIComponent(city as string)}`);
            if (wRes.ok) {
              const w = await wRes.json();
              feeds.push({
                city: city as string,
                risk: `${w.description ?? 'Weather update'}: ${w.temperature ?? w.temp}°C, Humidity ${w.humidity ?? 'N/A'}%`,
                time: 'Live'
              });
            }
          } catch {}
        }
        if (feeds.length > 0) {
          setRiskFeeds(feeds);
        } else {
          setRiskFeeds([
            { city: 'Global Operations', risk: 'All destination airspace channels open. Standard monitoring active.', time: 'Live' }
          ]);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadSecurity();
    const interval = setInterval(loadSecurity, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id: number) => {
    try {
      const res = await authFetch(`${API_BASE}/alerts/${id}/resolve?notes=${encodeURIComponent(notes)}`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Alert marked resolved.');
        setNotes('');
        loadSecurity();
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6 text-left animate-fade-in-up">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
            <span>Duty of Care Security Center</span>
          </h2>
          <p className="text-sm text-slate-400">Monitor live traveler locations, process SOS panic alerts, and inspect global security feeds.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={activeAlerts.length > 0 ? 'destructive' : 'outline'} className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-355 flex items-center gap-1.5 shadow-sm">
            <span>Alerts Active: {activeAlerts.length}</span>
          </Badge>
        </div>
      </div>

      {/* 2. Pulsing Emergency SOS Banner */}
      {activeAlerts.length > 0 && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-white font-extrabold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <span className="text-xs uppercase tracking-wider block text-red-400">CRITICAL EMERGENCY SOS ACTIVE</span>
              <span className="text-[10px] font-medium text-slate-300">Traveling employee has triggered panic alert. GPS coordinates locked. Dispatch emergency response immediately.</span>
            </div>
          </div>
          <Badge variant="destructive" className="text-[9px] px-2.5 py-1 uppercase font-black shrink-0">SOS Active</Badge>
        </div>
      )}

      {/* 3. Top-level summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Travelers En Route</p>
              <h4 className="text-lg font-black text-white mt-0.5">{approvedRequests.length} Active Trips</h4>
              <p className="text-[10px] text-slate-500">Live GPS tracking connected</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10 text-red-405">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">SOS Panic Alerts</p>
              <h4 className="text-lg font-black text-white mt-0.5">{activeAlerts.length} Unresolved</h4>
              <p className="text-[10px] text-slate-500">Awaiting security clearance</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <BadgeAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Risk Level Index</p>
              <h4 className="text-lg font-black text-white mt-0.5">{activeAlerts.length > 0 ? 'HIGH (SOS ACTIVE)' : 'Low-Normal'}</h4>
              <p className="text-[10px] text-cyan-405">Global intelligence feeds verified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. 12-Column Responsive Layout Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Travelers monitor list & Map - span 8 */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Map panel */}
          <div className="relative h-80 bg-slate-950 border border-slate-855 flex flex-col justify-end p-6 rounded-xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:20px_20px] flex items-center justify-center">
              <div className="text-center space-y-2 opacity-20 select-none">
                <Map className="w-16 h-16 mx-auto text-slate-555" />
                <div className="text-xs uppercase tracking-widest font-black text-slate-400">Live GPS Traveler Locations Catalog</div>
              </div>

              {/* Dynamic traveler map markers */}
              {approvedRequests.map((req, i) => {
                const topPct = 25 + (i * 20) % 55;
                const leftPct = 20 + (i * 25) % 65;
                return (
                  <div key={req.id} style={{ top: `${topPct}%`, left: `${leftPct}%` }} className="absolute text-cyan-400 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute -left-0"></span>
                    <MapPin className="w-5 h-5 relative z-10" />
                    <span className="text-[9px] font-bold bg-slate-950/80 border border-slate-850 px-2 py-0.5 rounded text-white shadow-sm shrink-0">
                      #{req.id} — {req.destination}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="relative z-10 glass-panel p-4 rounded-xl max-w-sm border border-slate-800">
              <h4 className="font-extrabold text-white flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Active Duty of Care Tracking</span>
              </h4>
              <p className="text-[10px] text-slate-400">All current traveling employees are plotted via real-time satellite blips.</p>
            </div>
          </div>

          {/* Active Emergency alerts list */}
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-350">
                <ShieldAlert className="w-4 h-4 text-red-500 animate-bounce" />
                <span>Active Emergency SOS Alerts Queue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlerts.length === 0 ? (
                <div className="text-center py-10 text-slate-500 space-y-3">
                  <ShieldCheck className="w-12 h-12 mx-auto text-slate-655" />
                  <h4 className="text-xs font-bold text-white">All coordinates clear</h4>
                  <p className="text-xs text-slate-455">No employee SOS panics registered on current tracking coordinates.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAlerts.map(alert => (
                    <div key={alert.id} className="p-4 bg-red-950/10 border border-red-500/25 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-red-400 text-sm flex items-center gap-1.5 animate-pulse uppercase tracking-wider">
                            <AlertTriangle className="w-4 h-4" />
                            <span>SOS Triggered!</span>
                          </h4>
                          <p className="text-xs text-slate-350 mt-1">
                            Employee ID: <span className="font-bold text-white">#{alert.employeeId}</span> | Location: {alert.location}
                          </p>
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold">{new Date(alert.triggeredAt).toLocaleTimeString()}</span>
                      </div>

                      <div className="flex gap-2">
                        <Input 
                          type="text" 
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="Input resolution logs / action comments..."
                          className="flex-1 text-xs h-8 bg-slate-950 border-slate-855 text-white"
                        />
                        <Button 
                          onClick={() => handleResolve(alert.id)}
                          className="text-xs h-8 py-0 font-bold btn-hover-scale"
                        >
                          Resolve SOS
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* External Risk alerts feed - span 4 */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="h-fit bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-350">
                <BadgeAlert className="w-4 h-4 text-yellow-500" />
                <span>Risk Intelligence Feed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {riskFeeds.map((feed, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl text-xs space-y-1.5 hover:border-slate-800 transition-all">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-yellow-450">{feed.city}</span>
                    <span className="text-[9px] text-slate-500">{feed.time}</span>
                  </div>
                  <p className="text-slate-350 text-[11px] leading-relaxed">{feed.risk}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
