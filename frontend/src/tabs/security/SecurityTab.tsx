import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Map, MapPin, BadgeAlert } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';

export default function SecurityTab() {
  const { authFetch } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [notes, setNotes] = useState('');

  const loadSecurity = async () => {
    try {
      const activeRes = await authFetch(`${API_BASE}/alerts/active`);
      if (activeRes.ok) setActiveAlerts(await activeRes.json());
    } catch (e) {}
  };

  useEffect(() => {
    loadSecurity();
    const interval = setInterval(loadSecurity, 5000);
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

  const riskFeeds = [
    { city: 'Manila', risk: 'Typhoon alert level warning. Moderate risk.', time: '10 min ago' },
    { city: 'Tokyo', risk: 'Minor seismic alert registered (4.2 Richter). No damage.', time: '1 hr ago' },
    { city: 'London', risk: 'Local public transit strike. Delays expected.', time: '3 hrs ago' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      {/* Travelers monitor list & Mock Map */}
      <div className="lg:col-span-2 space-y-6">
        {/* Mock Map panel */}
        <div className="relative h-80 bg-slate-900 border border-slate-800 flex flex-col justify-end p-6 rounded-xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] flex items-center justify-center">
            <div className="text-center space-y-2 opacity-30 select-none">
              <Map className="w-16 h-16 mx-auto text-slate-500" />
              <div className="text-xs uppercase tracking-widest font-black">Live GPS Traveler Locations Catalog</div>
            </div>
            {/* Blip dots */}
            <div className="absolute top-[40%] left-[30%] text-cyan-400 flex items-center gap-1 animate-pulse">
              <MapPin className="w-6 h-6" />
              <span className="text-[10px] font-bold bg-slate-950/70 border border-slate-800 px-2 py-0.5 rounded text-white">Bob (Manila)</span>
            </div>
            <div className="absolute top-[50%] left-[60%] text-indigo-400 flex items-center gap-1">
              <MapPin className="w-5 h-5" />
              <span className="text-[10px] font-bold bg-slate-950/70 border border-slate-800 px-2 py-0.5 rounded text-white">London trip</span>
            </div>
          </div>
          <div className="relative z-10 glass-panel p-4 rounded-xl max-w-sm border border-slate-800">
            <h4 className="font-extrabold text-white flex items-center gap-1 mb-1 text-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Active Duty of Care Tracking</span>
            </h4>
            <p className="text-[10px] text-slate-400">All current traveling employees are plotted via real-time satellite blips.</p>
          </div>
        </div>

        {/* Active Emergency alerts list */}
        <Card>
          <CardHeader className="border-b border-slate-800 pb-3 mb-4">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500 animate-bounce" />
              <span>Active Emergency SOS Alerts Queue</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeAlerts.length === 0 ? (
              <div className="text-center text-slate-500 py-6 bg-slate-900/30 border border-slate-950 rounded-xl">No active emergency situations reported.</div>
            ) : (
              <div className="space-y-4">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="p-4 bg-red-950/5 border border-red-900/35 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-red-400 text-sm flex items-center gap-1.5 animate-pulse">
                          <AlertTriangle className="w-4 h-4" />
                          <span>SOS Triggered!</span>
                        </h4>
                        <p className="text-xs text-slate-355 mt-1">Employee ID: <span className="font-bold text-white">{alert.employeeId}</span> | Location: {alert.location}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">{new Date(alert.triggeredAt).toLocaleTimeString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <Input 
                        type="text" 
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Input resolution logs / action comments..."
                        className="flex-1 text-xs h-8"
                      />
                      <Button 
                        onClick={() => handleResolve(alert.id)}
                        className="text-xs h-8 py-0 font-bold"
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

      {/* External Risk alerts feed */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader className="border-b border-slate-800 pb-3 mb-4">
          <CardTitle className="flex items-center gap-2">
            <BadgeAlert className="w-5 h-5 text-yellow-500" />
            <span>Risk Intelligence Feed</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {riskFeeds.map((feed, idx) => (
            <div key={idx} className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg text-xs space-y-1">
              <div className="flex justify-between items-center font-bold">
                <span className="text-yellow-500">{feed.city}</span>
                <span className="text-[9px] text-slate-500">{feed.time}</span>
              </div>
              <p className="text-slate-300">{feed.risk}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
