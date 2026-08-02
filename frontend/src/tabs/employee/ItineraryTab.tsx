import React, { useState, useEffect } from 'react';
import { Calendar, Info, Plane, Hotel, Truck, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';

interface ItineraryTabProps {
  onNavigateToRequisition?: () => void;
}

export default function ItineraryTab({ onNavigateToRequisition }: ItineraryTabProps) {
  const { authFetch } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<any>({
    temperature: 22,
    temp: 22,
    description: 'Partly Cloudy',
    humidity: 58,
    icon: '02d'
  });

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
          // Fetch real bookings from API
          const bRes = await authFetch(`${API_BASE}/travel/${selectedReq.id}/bookings`);
          if (bRes.ok) {
            setBookings(await bRes.json());
          } else {
            setBookings([]);
          }

          // Fetch shipments
          const sRes = await authFetch(`${API_BASE}/shipments/employee`);
          if (sRes.ok) {
            const sList = await sRes.json();
            setShipments(sList.filter((s: any) => s.linkedTravelRequestId === selectedReq.id));
          }

          // Fetch destination weather
          if (selectedReq.destination) {
            try {
              const wRes = await authFetch(`${API_BASE}/weather/current?city=${encodeURIComponent(selectedReq.destination)}`);
              if (wRes.ok) setWeather(await wRes.json());
            } catch {}
          }
        } catch (err) {}
      };
      fetchReqDetails();
    }
  }, [selectedReq]);

  const downloadItineraryPdf = async (requestId: number) => {
    try {
      const res = await authFetch(`${API_BASE}/pdf/itinerary/${requestId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `itinerary_${requestId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {}
  };

  // Stepper helper for shipment status
  const renderShipmentStepper = (status: string) => {
    const steps = ['PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
    const currentIdx = steps.indexOf(status);
    return (
      <div className="mt-3 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Shipment Progress</span>
          <span className="text-[10px] text-cyan-400 font-black">{status.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center w-full justify-between relative mt-2 px-1">
          {/* Connecting line */}
          <div className="absolute top-[7px] left-3 right-3 h-[2px] bg-slate-800 z-0">
            <div 
              className="h-full bg-cyan-500 transition-all duration-500" 
              style={{ width: `${(Math.max(0, currentIdx) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIdx;
            const isActive = idx === currentIdx;
            return (
              <div key={step} className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive ? 'bg-cyan-500 border-cyan-400 scale-110 shadow-lg shadow-cyan-500/50' :
                    isCompleted ? 'bg-indigo-500 border-indigo-400' : 'bg-slate-900 border-slate-700'
                  }`}
                >
                  {isCompleted && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                </div>
                <span className="text-[8px] text-slate-500 mt-1 font-bold scale-90 origin-center truncate max-w-[50px] uppercase">
                  {step === 'IN_TRANSIT' ? 'Transit' : step.toLowerCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper for trip progress line
  const renderTripProgressBar = (start: string, end: string) => {
    try {
      const today = new Date().getTime();
      const sDate = new Date(start).getTime();
      const eDate = new Date(end).getTime();
      
      if (today < sDate) return 0;
      if (today > eDate) return 100;
      
      const total = eDate - sDate;
      const progress = ((today - sDate) / total) * 100;
      return Math.round(progress);
    } catch (err) {
      return 0;
    }
  };

  if (loading) return <div className="text-center text-slate-500 py-10">Loading itineraries...</div>;

  return (
    <div className="space-y-6 text-left">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Plane className="w-7 h-7 text-cyan-400" />
            <span>My Itinerary & Tracking</span>
          </h2>
          <p className="text-sm text-slate-400">View active travel plans, book negotiated vendors, and track cargo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-350 flex items-center gap-1.5 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{requests.length} Total Requests</span>
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-350 flex items-center gap-1.5 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>{requests.filter(r => r.status === 'APPROVED').length} Approved</span>
          </Badge>
        </div>
      </div>

      {/* 2. Top-level Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate hover-glow bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Active Destination</p>
              <h4 className="text-lg font-black text-white mt-0.5">
                {selectedReq ? selectedReq.destination : 'None'}
              </h4>
              <p className="text-[10px] text-slate-500">
                {selectedReq ? `${selectedReq.startDate} to ${selectedReq.endDate}` : 'No trip selected'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate hover-glow bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Hotel className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Bookings Placed</p>
              <h4 className="text-lg font-black text-white mt-0.5">
                {selectedReq && bookings.length > 0 ? `${bookings.length} Booked` : '0 Bookings'}
              </h4>
              <p className="text-[10px] text-slate-500">Preferred vendor rates locked</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate hover-glow bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-450">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Linked Shipments</p>
              <h4 className="text-lg font-black text-white mt-0.5">
                {shipments.length} Active
              </h4>
              <p className="text-[10px] text-slate-500">Synchronized cargo assets</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weather & Actions Row */}
      {selectedReq && (
        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          {weather && (
            <Card className="flex-1 bg-gradient-to-r from-sky-950/40 to-cyan-950/30 border border-sky-800/30">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 text-2xl">
                  {weather.icon === '01d' || weather.icon === '01n' ? '☀️' :
                   weather.icon?.startsWith('02') ? '⛅' :
                   weather.icon?.startsWith('03') || weather.icon?.startsWith('04') ? '☁️' :
                   weather.icon?.startsWith('09') || weather.icon?.startsWith('10') ? '🌧️' :
                   weather.icon?.startsWith('13') ? '❄️' : '🌤️'}
                </div>
                <div>
                  <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Destination Weather</p>
                  <p className="text-lg font-black text-white">{weather.temperature ?? weather.temp}°C — {weather.description ?? 'N/A'}</p>
                  <p className="text-[10px] text-slate-500">{selectedReq.destination} • Humidity: {weather.humidity ?? 'N/A'}%</p>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              className="bg-cyan-600/15 border-cyan-700/40 text-cyan-300 hover:bg-cyan-600/30 h-full px-5"
              onClick={() => downloadItineraryPdf(selectedReq.id)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Download Itinerary PDF
            </Button>
          </div>
        </div>
      )}

      {/* Select Trip Filter panel */}
      <div 
        className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center p-3.5 sm:p-4 rounded-2xl w-full max-w-full overflow-hidden"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
        }}
      >
        <label className="text-xs sm:text-sm font-bold shrink-0" style={{ color: 'var(--text-secondary)' }}>
          Selected Trip:
        </label>
        <select 
          value={selectedReq?.id || ''} 
          onChange={(e) => setSelectedReq(requests.find(r => r.id === Number(e.target.value)))}
          className="w-full min-w-0 max-w-full rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold truncate cursor-pointer transition-all"
          style={{
            background: 'var(--input)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            fontSize: '16px',
          }}
        >
          {requests.map(r => (
            <option key={r.id} value={r.id} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
              {r.destination} ({r.startDate} to {r.endDate}) - {r.status}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Main 12-Column Responsive Layout Grid */}
      {selectedReq ? (
        <div className="grid grid-cols-12 gap-8">
          {/* Left panel (Overview & Steppers) - Span 4 */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Card className="h-fit">
              <CardHeader className="border-b border-slate-800 pb-3 mb-4">
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Trip Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex justify-between"><span className="text-slate-400 font-medium">Destination:</span><span className="font-bold text-white">{selectedReq.destination}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium">Dates:</span><span className="font-bold text-white">{selectedReq.startDate} to {selectedReq.endDate}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-medium">Purpose:</span><span className="text-slate-300 font-semibold">{selectedReq.purpose}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Budget:</span><span className="font-black text-cyan-450 text-sm">${selectedReq.estimatedCost}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <Badge variant={
                    selectedReq.status === 'APPROVED' ? 'success' :
                    selectedReq.status === 'PENDING' ? 'warning' : 'destructive'
                  }>{selectedReq.status}</Badge>
                </div>

                {/* Progress bar */}
                {selectedReq.status === 'APPROVED' && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1.5 uppercase">
                      <span>Trip Progress</span>
                      <span>{renderTripProgressBar(selectedReq.startDate, selectedReq.endDate)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" 
                        style={{ width: `${renderTripProgressBar(selectedReq.startDate, selectedReq.endDate)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {selectedReq.policyFlags && (
                  <Alert variant="warning" className="mt-4 border-yellow-500/20 bg-yellow-500/5">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <AlertTitle className="text-yellow-400 font-extrabold">Compliance Warnings</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 space-y-1 mt-1 text-[10px] text-slate-300">
                        {selectedReq.policyFlags.split(',').filter(Boolean).map((flag: string, idx: number) => (
                          <li key={idx}>{flag}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {selectedReq.status === 'APPROVED' && bookings.length === 0 && (
                  <div className="mt-4 p-4 text-center bg-cyan-950/10 border border-cyan-500/20 rounded-xl">
                    <Plane className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-pulse" />
                    <div className="text-xs font-black text-white mb-1">Lock Negotiated Rates</div>
                    <p className="text-[10px] text-slate-400 mb-4">Choose from corporate preferred vendors to automatically comply with policy rules.</p>
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
                        className="w-full text-xs font-extrabold btn-hover-scale"
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
                        className="w-full text-xs font-extrabold text-cyan-400 border border-slate-800 bg-slate-900/60 hover:bg-slate-800 btn-hover-scale"
                      >
                        Book Preferred Hotel ($1500)
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipment Status widgets */}
            {shipments.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Synchronized Cargo Status</h4>
                {shipments.map((s, idx) => (
                  <Card key={idx} className="bg-slate-900/30 border border-slate-850 p-4">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <h5 className="font-extrabold text-white text-xs">{s.description}</h5>
                        <p className="text-[10px] text-slate-500">Carrier: {s.carrier}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase border-indigo-500/20 text-indigo-400">{s.type}</Badge>
                    </div>
                    {renderShipmentStepper(s.status)}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Center Panel (Timeline) - Span 5 */}
          <Card className="col-span-12 lg:col-span-5 h-fit">
            <CardHeader className="border-b border-slate-800 pb-3 mb-4">
              <CardTitle className="text-sm uppercase tracking-wider">Itinerary Timeline &amp; Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l border-slate-850 pl-6 ml-4 space-y-8 text-xs">
                {/* Commencement */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 p-1.5 bg-slate-950 border border-slate-800 text-cyan-400 rounded-full">
                    <Calendar className="w-3 h-3" />
                  </span>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">{selectedReq.startDate}</div>
                  <h4 className="font-extrabold text-white text-sm mt-0.5">Trip Commencement</h4>
                  <p className="text-xs text-slate-400">Departure date scheduled to {selectedReq.destination}.</p>
                </div>

                {/* Bookings */}
                {bookings.map((b, idx) => {
                  const isFlight = b.type === 'FLIGHT';
                  const Icon = isFlight ? Plane : Hotel;
                  return (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-[31px] top-0 p-1.5 bg-slate-950 border border-slate-800 rounded-full ${isFlight ? 'text-blue-400' : 'text-purple-400'}`}>
                        <Icon className="w-3 h-3" />
                      </span>
                      <div className="text-[9px] font-black text-cyan-400 uppercase">{b.type} BOOKING</div>
                      <h4 className="font-extrabold text-white text-sm mt-0.5">{b.vendor}</h4>
                      <p className="text-xs text-slate-300">{b.details}</p>
                      <div className="text-xs text-cyan-400 font-bold mt-1">Cost Locked: ${b.cost}</div>
                    </div>
                  );
                })}

                {/* Shipments */}
                {shipments.map((s, idx) => {
                  const isAtRisk = selectedReq.startDate && s.expectedDelivery && new Date(s.expectedDelivery) > new Date(selectedReq.startDate) && s.status !== 'DELIVERED';
                  return (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-[31px] top-0 p-1.5 bg-slate-950 border border-slate-800 rounded-full ${isAtRisk ? 'text-red-400 animate-pulse border-red-500' : 'text-emerald-400'}`}>
                        <Truck className="w-3 h-3" />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-emerald-405 uppercase">Synchronized Shipment</span>
                        {isAtRisk && (
                          <Badge variant="destructive" className="text-[8px] animate-pulse">
                            Sync Danger
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-extrabold text-white text-sm mt-0.5">{s.description}</h4>
                      <div className="text-xs text-slate-350 space-y-1 mt-1.5">
                        <div><span className="text-slate-500 font-bold">Route:</span> {s.origin} &rarr; {s.destination}</div>
                        <div><span className="text-slate-500 font-bold">Scheduled Arrival:</span> <span className={isAtRisk ? 'text-red-400 font-bold' : ''}>{s.expectedDelivery}</span></div>
                        <div><span className="text-slate-500 font-bold">Status:</span> <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 font-bold">{s.status}</span></div>
                      </div>
                    </div>
                  );
                })}

                {/* Conclude */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 p-1.5 bg-slate-950 border border-slate-800 text-slate-500 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                  </span>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">{selectedReq.endDate}</div>
                  <h4 className="font-extrabold text-white text-sm mt-0.5">Return Scheduled</h4>
                  <p className="text-xs text-slate-400">Itinerary wraps. Return travel concluded.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel (Tips & Notifications) - Span 3 */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <Card>
              <CardHeader className="border-b border-slate-800 pb-2 mb-3">
                <CardTitle className="text-xs uppercase tracking-wider font-extrabold">Traveler Smart Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-slate-350">
                <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-lg">
                  <span className="font-bold text-white block mb-1">Comply with policy rules</span>
                  <p className="text-[11px] text-slate-400">Bookings utilizing preferred suppliers are auto-approved. Alternate vendors may require CTM override review.</p>
                </div>
                <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-lg">
                  <span className="font-bold text-white block mb-1">OCR Receipt Scanning</span>
                  <p className="text-[11px] text-slate-400">Submit receipt claims immediately on spend occurrence. OCR scans automatically detect pricing anomalies.</p>
                </div>
                <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-lg">
                  <span className="font-bold text-white block mb-1">Safety Duty of Care</span>
                  <p className="text-[11px] text-slate-400">In emergencies, click the "EMERGENCY SOS" button in your sidebar to update GPS coordinates for Security Command.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-slate-800 pb-2 mb-3">
                <CardTitle className="text-xs uppercase tracking-wider font-extrabold">Local Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span>Security Command Desk:</span>
                  <span className="text-white font-bold">+1 (800) 555-0199</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span>Logistics Sync Desk:</span>
                  <span className="text-white font-bold">ext. 4829</span>
                </div>
                <div className="flex justify-between">
                  <span>CTM Override Hot:</span>
                  <span className="text-white font-bold">ctm-support@voyacore.com</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Empty State Illustration */
        <div className="text-center py-20 bg-slate-900/20 border border-slate-850 rounded-xl max-w-xl mx-auto space-y-4">
          <Calendar className="w-12 h-12 mx-auto text-slate-650 animate-bounce" />
          <h4 className="text-base font-extrabold text-white">No active itineraries found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Create a travel requisition request to submit budget, destination, and purpose details to your department manager.</p>
          <div>
            <Button
              className="font-extrabold text-xs px-6 py-2 btn-hover-scale bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
              onClick={() => {
                if (onNavigateToRequisition) {
                  onNavigateToRequisition();
                }
              }}
            >
              Submit Travel Requisition
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
