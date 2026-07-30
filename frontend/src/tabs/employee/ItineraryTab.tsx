import React, { useState, useEffect } from 'react';
import { Calendar, Info, Plane, Hotel, Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';

export default function ItineraryTab() {
  const { authFetch } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadItineraries = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/travel/employee`);
      if (res.ok) {
        const list = await res.json();
        setRequests(list);
        if (list.length > 0 && !selectedReq) {
          setSelectedReq(list[0]);
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    loadItineraries();
  }, []);

  useEffect(() => {
    if (selectedReq) {
      const fetchReqDetails = async () => {
        try {
          const sRes = await authFetch(`${API_BASE}/shipments/employee`);
          const sList = await sRes.json();
          setShipments(sList.filter((s: any) => s.linkedTravelRequestId === selectedReq.id));
          
          if (selectedReq.destination === 'London') {
            setBookings([
              { type: 'FLIGHT', vendor: 'Delta Air Lines', cost: 1200, details: 'Delta DL-18, Seat 14A, departure 10:00 AM' },
              { type: 'HOTEL', vendor: 'Marriott Hotels', cost: 1500, details: 'Marriott Regent\'s Park, 5 nights' }
            ]);
          } else {
            setBookings([]);
          }
        } catch (err) {}
      };
      fetchReqDetails();
    }
  }, [selectedReq]);

  if (loading) return <div className="text-center text-slate-500 py-10">Loading itineraries...</div>;

  return (
    <div className="space-y-6 text-left">
      <div className="flex gap-4 items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <label className="text-sm font-semibold text-slate-400">Select Travel Trip:</label>
        <select 
          value={selectedReq?.id || ''} 
          onChange={(e) => setSelectedReq(requests.find(r => r.id === Number(e.target.value)))}
          className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
        >
          {requests.map(r => (
            <option key={r.id} value={r.id}>{r.destination} ({r.startDate} to {r.endDate}) - {r.status}</option>
          ))}
        </select>
      </div>

      {selectedReq ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip Summary Card */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader className="border-b border-slate-800 pb-3 mb-4">
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                <span>Trip Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Destination:</span><span className="font-semibold text-white">{selectedReq.destination}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Dates:</span><span className="font-semibold text-white">{selectedReq.startDate} to {selectedReq.endDate}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Purpose:</span><span className="text-slate-350">{selectedReq.purpose}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Budget Estimate:</span><span className="font-bold text-cyan-400">${selectedReq.estimatedCost}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status:</span>
                <Badge variant={
                  selectedReq.status === 'APPROVED' ? 'success' :
                  selectedReq.status === 'PENDING' ? 'warning' : 'destructive'
                }>{selectedReq.status}</Badge>
              </div>

              {selectedReq.policyFlags && (
                <Alert variant="warning" className="mt-4">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>Policy Violations Flagged</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-300">
                      {selectedReq.policyFlags.split(',').filter(Boolean).map((flag: string, idx: number) => (
                        <li key={idx}>{flag}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {selectedReq.status === 'APPROVED' && bookings.length === 0 && (
                <div className="mt-4 p-4 text-center bg-cyan-950/15 border border-cyan-500/20 rounded-lg">
                  <Plane className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-bounce" />
                  <div className="text-xs font-bold text-white mb-2">Itinerary Pending Bookings</div>
                  <p className="text-[10px] text-slate-400 mb-3">Your travel is approved! Choose preferred vendors now.</p>
                  <div className="space-y-2">
                    <Button 
                      onClick={async () => {
                        if (!window.confirm('Confirm flight booking with preferred vendor Delta Air Lines?')) return;
                        await authFetch(`${API_BASE}/travel/${selectedReq.id}/bookings`, {
                          method: 'POST',
                          body: JSON.stringify({ type: 'FLIGHT', vendor: 'Delta Air Lines', cost: 1200.00, details: 'Delta DL-18, Economy' })
                        });
                        loadItineraries();
                      }}
                      className="w-full text-xs font-extrabold"
                    >
                      Book Preferred Flight ($1200)
                    </Button>
                    <Button 
                      onClick={async () => {
                        if (!window.confirm('Confirm hotel booking with preferred vendor Marriott Hotels?')) return;
                        await authFetch(`${API_BASE}/travel/${selectedReq.id}/bookings`, {
                          method: 'POST',
                          body: JSON.stringify({ type: 'HOTEL', vendor: 'Marriott Hotels', cost: 1500.00, details: 'Marriott Regent\'s Park, 5 nights' })
                        });
                        loadItineraries();
                      }}
                      variant="secondary"
                      className="w-full text-xs font-extrabold text-cyan-400"
                    >
                      Book Preferred Hotel ($1500)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unified Timeline List */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-slate-800 pb-3 mb-4">
              <CardTitle>Itinerary Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-8">
                {/* Point 1: Trip Starts */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 p-1.5 bg-slate-900 border border-slate-800 text-cyan-400 rounded-full">
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                  <div className="text-xs text-slate-400">{selectedReq.startDate}</div>
                  <h4 className="font-extrabold text-white text-sm mt-0.5">Trip Commencement</h4>
                  <p className="text-xs text-slate-500">Departure date scheduled to {selectedReq.destination}.</p>
                </div>

                {/* Booked Itinerary Details */}
                {bookings.map((b, idx) => {
                  const isFlight = b.type === 'FLIGHT';
                  const Icon = isFlight ? Plane : Hotel;
                  return (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-[31px] top-0 p-1.5 bg-slate-900 border border-slate-800 rounded-full ${isFlight ? 'text-blue-400' : 'text-purple-400'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="text-[10px] font-bold text-cyan-500 uppercase">{b.type} BOOKING</div>
                      <h4 className="font-extrabold text-white text-sm mt-0.5">{b.vendor}</h4>
                      <p className="text-xs text-slate-300">{b.details}</p>
                      <div className="text-xs text-cyan-400 font-semibold mt-1">Cost: ${b.cost}</div>
                    </div>
                  );
                })}

                {/* Sync Shipments Details */}
                {shipments.map((s, idx) => {
                  const isAtRisk = selectedReq.startDate && s.expectedDelivery && new Date(s.expectedDelivery) > new Date(selectedReq.startDate) && s.status !== 'DELIVERED';
                  return (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-[31px] top-0 p-1.5 bg-slate-900 border border-slate-800 rounded-full ${isAtRisk ? 'text-red-400 animate-pulse border-red-500' : 'text-teal-400'}`}>
                        <Truck className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-teal-400 uppercase">SYNCHRONIZED SHIPMENT</span>
                        {isAtRisk && (
                          <Badge variant="destructive" className="text-[9px] animate-pulse">
                            Delivery Late Sync Danger
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-extrabold text-white text-sm mt-0.5">{s.description}</h4>
                      <div className="text-xs text-slate-300 space-y-1 mt-1.5">
                        <div><span className="text-slate-500">Carrier:</span> {s.carrier}</div>
                        <div><span className="text-slate-500">Route:</span> {s.origin} &rarr; {s.destination}</div>
                        <div><span className="text-slate-500">Scheduled Arrival:</span> <span className={isAtRisk ? 'text-red-400 font-bold' : 'text-slate-300'}>{s.expectedDelivery}</span></div>
                        <div><span className="text-slate-500">Status:</span> <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-850 font-semibold">{s.status}</span></div>
                      </div>
                    </div>
                  );
                })}

                {/* Point Last: Trip Ends */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 p-1.5 bg-slate-900 border border-slate-800 text-slate-500 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </span>
                  <div className="text-xs text-slate-400">{selectedReq.endDate}</div>
                  <h4 className="font-extrabold text-white text-sm mt-0.5">Return Scheduled</h4>
                  <p className="text-xs text-slate-500">Itinerary wraps. Return travel concluded.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center text-slate-500 py-20 bg-slate-950/20 border border-slate-900 rounded-xl">
          <Plane className="w-12 h-12 mx-auto text-slate-600 mb-2" />
          <p>No active itineraries found. Create a travel request to begin planning.</p>
        </div>
      )}
    </div>
  );
}
