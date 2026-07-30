import React, { useState, useEffect } from 'react';
import { Truck, AlertTriangle } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const SHIPMENT_STATUSES = ['PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'CUSTOMS_HOLD', 'DELIVERED'];

export default function LogisticsTab() {
  const { authFetch } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Creation form state
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PROTOTYPE');
  const [linkedTravelRequestId, setLinkedTravelRequestId] = useState<string>('');
  const [origin, setOrigin] = useState('Chicago Hub');
  const [destination, setDestination] = useState('London Office');
  const [carrier, setCarrier] = useState('FedEx Logistics');
  const [customsDocs, setCustomsDocs] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');

  const loadLogistics = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/shipments`);
      if (res.ok) {
        setShipments(await res.json());
      }
      const trRes = await authFetch(`${API_BASE}/travel`);
      if (trRes.ok) {
        setTrips(await trRes.json());
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    loadLogistics();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE}/shipments`, {
        method: 'POST',
        body: JSON.stringify({
          description,
          type,
          linkedTravelRequestId: linkedTravelRequestId ? Number(linkedTravelRequestId) : null,
          origin,
          destination,
          carrier,
          customsDocs,
          expectedDelivery,
          status: 'PREPARING'
        })
      });
      if (res.ok) {
        loadLogistics();
        setDescription('');
        setCustomsDocs('');
        setExpectedDelivery('');
      }
    } catch (err) {}
  };

  const advanceStatus = async (id: number, currentStatus: string) => {
    const idx = SHIPMENT_STATUSES.indexOf(currentStatus);
    if (idx === -1 || idx === SHIPMENT_STATUSES.length - 1) return;
    const nextStatus = SHIPMENT_STATUSES[idx + 1];
    
    try {
      const res = await authFetch(`${API_BASE}/shipments/${id}/status?status=${nextStatus}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        loadLogistics();
      }
    } catch (e) {}
  };

  if (loading) return <div className="text-center text-slate-500 py-10">Loading logistics board...</div>;

  // Calculate statistics for CTM/Logistics
  const totalCargoCount = shipments.length;
  const inTransitCargo = shipments.filter(s => s.status === 'IN_TRANSIT').length;
  const customsHoldCargo = shipments.filter(s => s.status === 'CUSTOMS_HOLD').length;

  return (
    <div className="space-y-6 text-left animate-fade-in-up">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Truck className="w-7 h-7 text-cyan-400" />
            <span>Logistics Assets Pipeline</span>
          </h2>
          <p className="text-sm text-slate-400">Dispatch, track, and manage customs clearance tags for cargo synchronized with employee itineraries.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-355 flex items-center gap-1.5 shadow-sm">
            <span>Cargo Tracked: {totalCargoCount}</span>
          </Badge>
        </div>
      </div>

      {/* 2. Top-level summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">In Transit Cargo</p>
              <h4 className="text-lg font-black text-white mt-0.5">{inTransitCargo} Shipments</h4>
              <p className="text-[10px] text-slate-500">Live carriers updates active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10 text-red-405">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Customs Holds</p>
              <h4 className="text-lg font-black text-white mt-0.5">{customsHoldCargo} Flags</h4>
              <p className="text-[10px] text-red-400 font-bold uppercase">Requires paperwork override</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-450">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Delivered Assets</p>
              <h4 className="text-lg font-black text-white mt-0.5">
                {shipments.filter(s => s.status === 'DELIVERED').length} Done
              </h4>
              <p className="text-[10px] text-slate-500">Timeline synchronized successfully</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Dispatch form */}
      <Card className="bg-slate-900/40 border border-slate-850">
        <CardHeader className="border-b border-slate-850 pb-3 mb-4">
          <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-350">
            <Truck className="w-4 h-4 text-cyan-400" />
            <span>Dispatch Synchronized Asset Shipment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-450 mb-1.5 font-bold">Description</label>
              <Input type="text" required value={description} onChange={e => setDescription(e.target.value)} className="bg-slate-950 border-slate-800 text-white text-xs h-9" />
            </div>
            <div>
              <label className="block text-slate-450 mb-1.5 font-bold">Asset Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs h-9 focus:outline-none focus:border-cyan-500">
                <option value="PROTOTYPE">PROTOTYPE</option>
                <option value="SAMPLE">SAMPLE</option>
                <option value="BOOTH">BOOTH</option>
                <option value="MARKETING">MARKETING</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-455 mb-1.5 font-bold">Link Trip ID</label>
              <select value={linkedTravelRequestId} onChange={e => setLinkedTravelRequestId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs h-9 focus:outline-none focus:border-cyan-500">
                <option value="">No Travel Link</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>{t.destination} (Id: #{t.id} - Starts: {t.startDate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-450 mb-1.5 font-bold">Expected Arrival</label>
              <Input type="date" required value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} className="bg-slate-950 border-slate-800 text-white text-xs h-9" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-455 mb-1.5 font-bold">Customs ATA Carnet Declarations</label>
              <Input type="text" value={customsDocs} onChange={e => setCustomsDocs(e.target.value)} placeholder="e.g. Carnet ATA #GB-4839, Commercial Invoice" className="bg-slate-950 border-slate-800 text-white text-xs h-9" />
            </div>
            <div>
              <label className="block text-slate-450 mb-1.5 font-bold">Carrier</label>
              <Input type="text" required value={carrier} onChange={e => setCarrier(e.target.value)} className="bg-slate-950 border-slate-800 text-white text-xs h-9" />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full font-bold btn-hover-scale h-9 text-xs">Dispatch Shipment</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 4. Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {SHIPMENT_STATUSES.map(colStatus => {
          const colList = shipments.filter(s => s.status === colStatus);
          return (
            <div 
              key={colStatus} 
              className="bg-slate-900/30 p-4 rounded-xl border border-slate-850 min-h-[350px] flex flex-col space-y-4 shadow-xl hover:border-slate-800 transition-all"
            >
              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <span className="font-black text-[10px] text-white uppercase tracking-wider">
                  {colStatus.replace('_', ' ')}
                </span>
                <span className="bg-slate-950 text-cyan-400 font-bold px-2 py-0.5 rounded-full border border-slate-850 text-[9px]">
                  {colList.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-1">
                {colList.length === 0 ? (
                  <div className="text-[10px] text-slate-600 text-center py-10 font-bold uppercase tracking-wider">Empty Lane</div>
                ) : (
                  colList.map(s => {
                    let isAtRisk = false;
                    let tripStart: string | null = null;
                    if (s.linkedTravelRequestId && s.expectedDelivery) {
                      const linked = trips.find(t => t.id === s.linkedTravelRequestId);
                      if (linked) {
                        tripStart = linked.startDate;
                        isAtRisk = new Date(s.expectedDelivery) > new Date(linked.startDate) && s.status !== 'DELIVERED';
                      }
                    }

                    return (
                      <div 
                        key={s.id} 
                        onClick={() => advanceStatus(s.id, s.status)}
                        className={`p-3.5 rounded-xl border text-left text-xs cursor-pointer bg-slate-950/40 hover:bg-slate-900/60 transition-all space-y-2.5 hover:border-cyan-500/40 relative overflow-hidden ${
                          isAtRisk ? 'border-red-500/25 bg-red-950/5 shadow-md shadow-red-950/15' : 'border-slate-850'
                        }`}
                      >
                        {/* Glow indicator line at left border */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                          colStatus === 'DELIVERED' ? 'bg-emerald-500' :
                          colStatus === 'CUSTOMS_HOLD' ? 'bg-red-500' :
                          isAtRisk ? 'bg-yellow-500' : 'bg-cyan-500'
                        }`} />

                        <div className="flex justify-between font-extrabold text-white pl-1.5">
                          <span className="truncate max-w-[100px] text-xs">{s.description}</span>
                          <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-indigo-500/20 text-indigo-400 uppercase font-black shrink-0">
                            {s.type}
                          </Badge>
                        </div>
                        
                        {isAtRisk && (
                          <Badge variant="destructive" className="text-[8px] animate-pulse py-0 text-left font-black flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                            <span>Delivery Late Sync</span>
                          </Badge>
                        )}

                        <div className="text-[10px] text-slate-400 space-y-1 pl-1.5">
                          <div><span className="text-slate-600 font-bold">Carrier:</span> {s.carrier}</div>
                          <div><span className="text-slate-600 font-bold">ETA:</span> {s.expectedDelivery}</div>
                          {tripStart && <div><span className="text-slate-600 font-bold">Trip Start:</span> {tripStart}</div>}
                        </div>

                        {s.customsDocs && (
                          <div className="text-[9px] bg-slate-950 p-1.5 rounded border border-slate-900 text-slate-500 truncate ml-1.5">
                            📄 {s.customsDocs}
                          </div>
                        )}

                        {s.status !== 'DELIVERED' && (
                          <div className="text-[8px] text-cyan-505/80 text-right uppercase font-extrabold hover:underline pl-1.5">
                            Advance status &rarr;
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
