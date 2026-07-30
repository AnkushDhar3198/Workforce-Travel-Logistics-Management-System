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

  return (
    <div className="space-y-8 text-left">
      {/* Creation form */}
      <Card>
        <CardHeader className="border-b border-slate-800 pb-3 mb-4">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <span>Dispatch Synchronized Asset Shipment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1.5 font-bold">Description</label>
              <Input type="text" required value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-slate-400 mb-1.5 font-bold">Asset Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white text-sm focus:outline-none">
                <option value="PROTOTYPE">PROTOTYPE</option>
                <option value="SAMPLE">SAMPLE</option>
                <option value="BOOTH">BOOTH</option>
                <option value="MARKETING">MARKETING</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1.5 font-bold">Link Trip ID</label>
              <select value={linkedTravelRequestId} onChange={e => setLinkedTravelRequestId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white text-sm focus:outline-none">
                <option value="">No Travel Link</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>{t.destination} (Id: #{t.id} - Starts: {t.startDate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1.5 font-bold">Expected Arrival</label>
              <Input type="date" required value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1.5 font-bold">Customs ATA Carnet Declarations</label>
              <Input type="text" value={customsDocs} onChange={e => setCustomsDocs(e.target.value)} placeholder="e.g. Carnet ATA #GB-4839, Commercial Invoice" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1.5 font-bold">Carrier</label>
              <Input type="text" required value={carrier} onChange={e => setCarrier(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full font-bold">Dispatch Shipment</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {SHIPMENT_STATUSES.map(colStatus => {
          const colList = shipments.filter(s => s.status === colStatus);
          return (
            <div key={colStatus} className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/60 min-h-[300px] flex flex-col space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-extrabold text-xs text-white uppercase tracking-wider">{colStatus.replace('_', ' ')}</span>
                <span className="bg-slate-900 text-slate-500 font-bold px-1.5 py-0.5 rounded text-[10px]">{colList.length}</span>
              </div>

              <div className="flex-1 space-y-3">
                {colList.map(s => {
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
                      className={`p-3 rounded-lg border text-left text-xs cursor-pointer bg-slate-900/50 backdrop-blur hover:border-cyan-500/40 transition-all space-y-2 ${
                        isAtRisk ? 'border-red-900 bg-red-950/5 shadow-lg shadow-red-950/20' : 'border-slate-850'
                      }`}
                    >
                      <div className="flex justify-between font-extrabold text-white">
                        <span className="truncate max-w-[100px]">{s.description}</span>
                        <Badge variant="secondary" className="text-[8px] px-1 py-0 rounded uppercase shrink-0 font-bold">{s.type}</Badge>
                      </div>
                      
                      {isAtRisk && (
                        <Badge variant="destructive" className="text-[8px] animate-pulse py-0 text-left font-black flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                          <span>Delivery Late Sync danger</span>
                        </Badge>
                      )}

                      <div className="text-[10px] text-slate-400 space-y-0.5">
                        <div><span className="text-slate-600 font-bold">Carrier:</span> {s.carrier}</div>
                        <div><span className="text-slate-600 font-bold">Eta:</span> {s.expectedDelivery}</div>
                        {tripStart && <div><span className="text-slate-600 font-bold">Trip Starts:</span> {tripStart}</div>}
                      </div>

                      {s.customsDocs && (
                        <div className="text-[9px] bg-slate-950 p-1.5 rounded border border-slate-900 text-slate-400 truncate">
                          📄 {s.customsDocs}
                        </div>
                      )}

                      {s.status !== 'DELIVERED' && (
                        <div className="text-[8px] text-cyan-500/70 text-right uppercase font-semibold hover:underline">Click to advance &rarr;</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
