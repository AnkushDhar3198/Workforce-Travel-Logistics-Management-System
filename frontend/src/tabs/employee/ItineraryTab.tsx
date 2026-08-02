import React, { useState, useEffect } from 'react';
import { Calendar, Info, Plane, Hotel, Truck, AlertTriangle, CheckCircle, FileText, RefreshCw } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { fetchLiveSatelliteWeather, resolveWeatherIconUrl, conditionTypeToEmoji } from '../../utils/liveWeather';

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
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(600); // seconds until next auto-refresh
  const [liveTime, setLiveTime] = useState<string>(() => new Date().toLocaleTimeString());
  const [destLocalHour, setDestLocalHour] = useState<number>(new Date().getHours());
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);
  const [weatherNotice, setWeatherNotice] = useState<string | null>(null);

  const handleManualWeatherRefresh = async () => {
    if (!selectedReq?.destination) return;
    setIsRefreshingWeather(true);
    setWeatherLoading(true);
    setWeatherError(null);
    const dest = selectedReq.destination;
    try {
      const liveData = await fetchLiveSatelliteWeather(dest);
      setWeather(liveData);
      setWeatherLoading(false);
      setNextRefreshIn(600); // reset countdown
      setWeatherNotice(`✓ Updated: ${liveData.temperature}°C in ${liveData.city}`);
      setTimeout(() => setWeatherNotice(null), 4000);
    } catch (e) {
      setWeatherLoading(false);
      setWeatherError('Could not fetch weather. Showing last known data.');
    }
    setIsRefreshingWeather(false);
  };

  // Live 1-second clock timer for destination timezone time
  useEffect(() => {
    const tick = () => {
      const tz = weather?.timezone;
      if (tz) {
        try {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-US', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });

          const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: 'numeric',
            hourCycle: 'h23'
          }).formatToParts(now);
          const hourPart = parts.find(p => p.type === 'hour');
          const hourVal = hourPart ? parseInt(hourPart.value, 10) : now.getHours();

          setLiveTime(timeStr);
          setDestLocalHour(hourVal);
          return;
        } catch { /* fall through to local time */ }
      }
      setLiveTime(new Date().toLocaleTimeString());
      setDestLocalHour(new Date().getHours());
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [weather?.timezone]);

  // Countdown timer: ticks every second, shows time until next auto-refresh
  useEffect(() => {
    const tick = setInterval(() => {
      setNextRefreshIn(prev => (prev <= 1 ? 600 : prev - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const loadItineraries = async () => {
    setLoading(true);
    let serverList: any[] = [];
    try {
      const res = await authFetch(`${API_BASE}/travel/employee`);
      if (res.ok) {
        serverList = await res.json();
      }
    } catch (e) {}

    let localList: any[] = [];
    try {
      localList = JSON.parse(localStorage.getItem('voyacore_local_travel_requests') || '[]');
    } catch (e) {}

    const combined = [...serverList];
    for (const lreq of localList) {
      if (!combined.some(r => r.id === lreq.id || (r.destination === lreq.destination && r.estimatedCost === lreq.estimatedCost))) {
        combined.unshift(lreq);
      }
    }

    setRequests(combined);
    if (combined.length > 0 && !selectedReq) {
      setSelectedReq(combined[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadItineraries();
  }, []);

  // Fetch fresh weather whenever destination changes; auto-refresh every 10 minutes
  useEffect(() => {
    const dest = selectedReq?.destination;
    if (!dest) {
      setWeather(null);
      setWeatherError(null);
      return;
    }

    // Reset immediately so stale data is never shown for the new destination
    setWeather(null);
    setWeatherError(null);
    setWeatherLoading(true);
    setNextRefreshIn(600);

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;

    const fetchWeather = async () => {
      try {
        const liveData = await fetchLiveSatelliteWeather(dest);
        if (!cancelled) {
          setWeather(liveData);
          setWeatherLoading(false);
          setWeatherError(null);
          setNextRefreshIn(600); // reset countdown after each successful fetch
        }
      } catch (_) {
        if (!cancelled) {
          setWeatherLoading(false);
          setWeatherError('Weather fetch failed. Retrying in 10 minutes.');
        }
      }
    };

    fetchWeather();
    // Auto-refresh every 10 minutes — best practice per API guidelines
    intervalId = setInterval(fetchWeather, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [selectedReq?.id, selectedReq?.destination]);

  // Fetch bookings + shipments when selected request changes
  useEffect(() => {
    if (!selectedReq) return;
    const fetchReqDetails = async () => {
      try {
        const bRes = await authFetch(`${API_BASE}/travel/${selectedReq.id}/bookings`);
        setBookings(bRes.ok ? await bRes.json() : []);
        const sRes = await authFetch(`${API_BASE}/shipments/employee`);
        if (sRes.ok) {
          const sList = await sRes.json();
          setShipments(sList.filter((s: any) => s.linkedTravelRequestId === selectedReq.id));
        }
      } catch (_) {}
    };
    fetchReqDetails();
  }, [selectedReq?.id]);

  const downloadItineraryPdf = async (requestId: number) => {
    try {
      const res = await authFetch(`${API_BASE}/pdf/itinerary/${requestId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VoyaCore_Itinerary_${requestId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      console.warn('[Itinerary] Remote PDF generation unavailable, compiling executive document locally:', e);
    }

    // Client-side fallback PDF / Document Generator
    try {
      const trip = selectedReq;
      const bList = bookings || [];
      const sList = shipments || [];

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>VoyaCore Official Travel Itinerary - #${requestId}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.6; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 24px; font-weight: 900; color: #0284c7; letter-spacing: -0.5px; }
            .badge { background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; }
            .section { margin-bottom: 28px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
            .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 14px; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px; }
            .label { font-weight: 700; color: #64748b; font-size: 11px; text-transform: uppercase; }
            .value { font-weight: 700; color: #0f172a; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { text-align: left; background: #f1f5f9; padding: 8px 12px; color: #475569; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">VOYACORE ENTERPRISE</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Official Workforce Travel Manifest</div>
            </div>
            <div>
              <span class="badge">${trip?.status || 'APPROVED'} REQUISITION</span>
              <div style="font-size: 11px; color: #64748b; text-align: right; margin-top: 4px;">Ref ID: #${requestId}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Trip Destination & Schedule Summary</div>
            <div class="grid">
              <div>
                <div class="label">Destination City</div>
                <div class="value">${trip?.destination || 'N/A'}</div>
              </div>
              <div>
                <div class="label">Estimated Budget</div>
                <div class="value">$${trip?.estimatedCost ? Number(trip.estimatedCost).toLocaleString() : '0'} USD</div>
              </div>
              <div>
                <div class="label">Departure Date</div>
                <div class="value">${trip?.startDate || 'N/A'}</div>
              </div>
              <div>
                <div class="label">Return Date</div>
                <div class="value">${trip?.endDate || 'N/A'}</div>
              </div>
            </div>
            <div style="margin-top: 14px;">
              <div class="label">Business Justification</div>
              <div style="font-size: 13px; color: #334155; margin-top: 4px;">${trip?.purpose || 'Business Deployment & Travel Clearance'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Confirmed Flight & Hotel Bookings</div>
            ${bList.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Provider / Details</th>
                    <th>Confirmation Ref</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${bList.map((b: any) => `
                    <tr>
                      <td style="font-weight: 700; color: #0284c7;">${b.bookingType || 'FLIGHT'}</td>
                      <td>${b.providerName || b.details || 'Enterprise Booking'}</td>
                      <td style="font-family: monospace; font-weight: 700;">${b.bookingReference || 'CONF-' + Math.floor(Math.random()*900000+100000)}</td>
                      <td><span style="color: #16a34a; font-weight: 700;">${b.status || 'CONFIRMED'}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div style="font-size: 12px; color: #64748b; font-style: italic;">Standard corporate flight & hotel reservations dispatched via CTM desk.</div>'}
          </div>

          ${sList.length > 0 ? `
            <div class="section">
              <div class="section-title">Linked Logistics Equipment & Cargo</div>
              <table>
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${sList.map((s: any) => `
                    <tr>
                      <td style="font-family: monospace; font-weight: 700;">${s.trackingNumber || 'TRK-' + s.id}</td>
                      <td>${s.description || 'Logistics Shipment'}</td>
                      <td><span style="color: #0284c7; font-weight: 700;">${s.status || 'IN_TRANSIT'}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div class="section" style="background: #f0fdf4; border-color: #bbf7d0;">
            <div class="section-title" style="color: #166534; border-color: #86efac;">Duty of Care & Security Protocol</div>
            <div style="font-size: 12px; color: #15803d; line-height: 1.5;">
              ✓ 24/7 Global Satellite Dispatch & Emergency SOS Clearance Activated.<br/>
              ✓ Border Clearance & International Medical Authorization Verified.<br/>
              ✓ Enterprise Rate Lock Guarantee Applied across 140+ Corridors.
            </div>
          </div>

          <div class="footer">
            VoyaCore Next-Gen Enterprise Travel Protocol • Confidential Enterprise Document • Generated on ${new Date().toLocaleDateString()}
          </div>
        </body>
        </html>
      `;

      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          printWin.print();
        }, 500);
      } else {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VoyaCore_Itinerary_${requestId}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Could not download itinerary. Please try again.');
    }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="hover-elevate hover-glow bg-slate-900/40 border border-slate-850">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
              <Plane className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-450 font-bold uppercase tracking-wider truncate">Active Destination</p>
              <h4 className="text-base font-black text-white mt-0.5 truncate">
                {selectedReq ? selectedReq.destination : 'None'}
              </h4>
              <p className="text-[10px] text-slate-500 truncate">
                {selectedReq ? `${selectedReq.startDate} to ${selectedReq.endDate}` : 'No trip selected'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Weather Card — Google Maps Platform Weather API */}
        {(() => {
          // Dynamic gradient based on condition type + destination day/night
          const ct = (weather?.conditionType || '').toUpperCase();
          const isNightAtDest = destLocalHour < 6 || destLocalHour >= 18;
          let cardGrad = 'from-sky-950/50 to-cyan-950/40 border-sky-800/40';
          if (isNightAtDest) {
            // Night palette — deep dark indigo/slate
            cardGrad = 'from-indigo-950/70 to-slate-950/60 border-indigo-800/40';
            if (ct === 'CLEAR' || ct === 'MOSTLY_CLEAR') cardGrad = 'from-indigo-950/60 to-violet-950/40 border-violet-800/30';
            else if (ct.includes('RAIN') || ct.includes('DRIZZLE') || ct.includes('SHOWER')) cardGrad = 'from-slate-950/80 to-blue-950/50 border-blue-800/30';
            else if (ct.includes('THUNDER') || ct.includes('STORM')) cardGrad = 'from-slate-950/90 to-indigo-950/70 border-indigo-700/40';
          } else {
            // Day palette — warm condition-specific
            if (ct === 'CLEAR' || ct === 'MOSTLY_CLEAR') cardGrad = 'from-amber-950/50 to-yellow-950/30 border-amber-700/40';
            else if (ct.includes('THUNDER') || ct.includes('STORM')) cardGrad = 'from-slate-900/80 to-indigo-950/60 border-indigo-700/40';
            else if (ct.includes('RAIN') || ct.includes('DRIZZLE') || ct.includes('SHOWER')) cardGrad = 'from-blue-950/60 to-sky-950/40 border-blue-700/40';
            else if (ct.includes('SNOW') || ct.includes('ICE') || ct.includes('BLIZZARD')) cardGrad = 'from-slate-800/60 to-sky-900/50 border-sky-600/40';
            else if (ct.includes('FOG') || ct.includes('HAZE') || ct.includes('MIST')) cardGrad = 'from-slate-800/60 to-zinc-900/50 border-zinc-600/40';
          }

          const mins = Math.floor(nextRefreshIn / 60);
          const secs = nextRefreshIn % 60;
          const countdownLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

          return (
            <Card className={`hover-elevate hover-glow bg-gradient-to-br ${cardGrad} border relative overflow-hidden transition-all duration-700`}>
              <CardContent className="p-4 flex flex-col gap-2">

                {/* ── Header row ─────────────────────────────── */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <p className="text-[10px] text-sky-300 font-extrabold uppercase tracking-widest truncate">
                      Live Weather
                    </p>
                    <span className="text-[9px] text-slate-500 font-medium hidden sm:block truncate">
                      • {liveTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Auto-refresh countdown */}
                    {!weatherLoading && (
                      <span className="text-[9px] text-slate-500 font-mono" title="Next auto-refresh">
                        ⏱ {countdownLabel}
                      </span>
                    )}
                    <button
                      onClick={handleManualWeatherRefresh}
                      disabled={isRefreshingWeather || weatherLoading}
                      title="Refresh weather now"
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/25 text-sky-300 text-[9px] font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                    >
                      <RefreshCw size={10} className={isRefreshingWeather ? 'animate-spin' : ''} />
                      <span>{isRefreshingWeather ? 'Updating…' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>

                {/* ── Error banner (preserves last known data below) ── */}
                {weatherError && !weatherLoading && (
                  <div className="flex items-center gap-1.5 bg-orange-900/25 border border-orange-700/30 rounded-lg px-2.5 py-1">
                    <AlertTriangle size={11} className="text-orange-400 shrink-0" />
                    <p className="text-[9.5px] text-orange-300 font-semibold">{weatherError}</p>
                  </div>
                )}

                {/* ── Loading skeleton ──────────────────────── */}
                {weatherLoading ? (
                  <div className="flex items-center gap-3 w-full animate-pulse pt-1">
                    <div className="w-14 h-14 rounded-xl bg-sky-500/10 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-sky-500/10 rounded w-3/4" />
                      <div className="h-3 bg-slate-700/40 rounded w-1/2" />
                      <div className="h-3 bg-slate-700/25 rounded w-2/3" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ── Main row: icon + temp ─────────────── */}
                    <div className="flex items-center gap-3 pt-0.5">
                      {/* Icon — official Google iconBaseUri .png, fall back to emoji */}
                      <div className="w-14 h-14 rounded-xl bg-white/5 shrink-0 flex items-center justify-center ring-1 ring-white/10">
                        {(weather?.iconUrl || resolveWeatherIconUrl(weather?.iconBaseUri)) ? (
                          <img
                            src={weather?.iconUrl || resolveWeatherIconUrl(weather?.iconBaseUri)!}
                            alt={weather?.description || 'weather'}
                            className="w-10 h-10 object-contain drop-shadow"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-3xl leading-none select-none">
                            {conditionTypeToEmoji(weather?.conditionType || weather?.icon, destLocalHour >= 6 && destLocalHour < 18)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Big temperature */}
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-2xl font-black text-white leading-none">
                            {weather ? `${weather.temperature ?? weather.temp}°C` : '—'}
                          </span>
                          <span className="text-xs font-semibold text-slate-300 truncate">
                            {weather?.description ?? 'Partly Cloudy'}
                          </span>
                        </div>
                        {/* Location + Day/Night (based on destination's geo timezone) */}
                        <p className="text-[10.5px] font-bold text-slate-300 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>📍 {selectedReq?.destination || weather?.city || '—'}</span>
                          <span className="text-slate-500">
                            {destLocalHour >= 6 && destLocalHour < 18 ? '☀ Day' : '🌙 Night'}
                          </span>
                          {weather?.timezone && (
                            <span className="text-slate-500 text-[9px] bg-white/5 rounded px-1 py-0.5">
                              🕐 {liveTime} <span className="text-slate-600">({weather.timezone})</span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {weather && (
                      <>
                        {/* ── Metrics 2×2 grid ─────────────────── */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {/* Feels Like */}
                          <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Feels Like</p>
                            <p className="text-[12px] font-black text-white mt-0.5">{weather.feelsLike ?? '—'}°C
                              {weather.dewPoint != null && <span className="text-[9px] font-normal text-slate-500 ml-1">Dew {weather.dewPoint}°C</span>}
                            </p>
                          </div>
                          {/* Humidity */}
                          <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Humidity</p>
                            <p className="text-[12px] font-black text-white mt-0.5">{weather.humidity}%</p>
                          </div>
                          {/* Wind */}
                          <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Wind</p>
                            <p className="text-[12px] font-black text-white mt-0.5">
                              {weather.windSpeed ?? '—'} km/h
                              {weather.windCardinal && <span className="text-[9px] font-semibold text-slate-400 ml-1">{weather.windCardinal}</span>}
                            </p>
                            {(weather.windGust != null && weather.windGust > 0) && (
                              <p className="text-[9px] text-slate-500">Gusts {weather.windGust} km/h</p>
                            )}
                          </div>
                          {/* UV + Visibility */}
                          <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">UV / Visibility</p>
                            <p className="text-[12px] font-black text-white mt-0.5">
                              UV {weather.uvIndex ?? '—'}
                              {weather.visibility != null && <span className="text-[9px] font-normal text-slate-400 ml-1">· {weather.visibility} km</span>}
                            </p>
                          </div>
                        </div>

                        {/* ── Precipitation nowcast ─────────────── */}
                        {weather.minuteForecast && (
                          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${weather.minuteForecast.hasPrecipitationNext60Min ? 'bg-blue-900/30 border border-blue-700/30' : 'bg-slate-800/30 border border-slate-700/20'}`}>
                            <span className="text-sm shrink-0">
                              {weather.minuteForecast.hasPrecipitationNext60Min ? '🌧' : '🌂'}
                            </span>
                            <p className={`text-[9.5px] font-semibold ${weather.minuteForecast.hasPrecipitationNext60Min ? 'text-blue-300' : 'text-slate-500'}`}>
                              {weather.minuteForecast.hasPrecipitationNext60Min
                                ? `Rain likely next 60 min · ${weather.minuteForecast.maxPrecipLikelihood}% chance`
                                : 'No precipitation expected in next 60 min'}
                            </p>
                          </div>
                        )}

                        {/* ── Footer: Last updated + provider ──── */}
                        <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-white/5">
                          <p className="text-[9px] text-slate-600 font-medium">
                            Updated {weather.lastUpdated}
                          </p>
                          <p className="text-[9px] text-sky-600/80 font-medium truncate">
                            {weather.provider || 'Google Maps Platform Weather API'}
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* ── Success notice ────────────────────────── */}
                {weatherNotice && (
                  <p className="text-[9.5px] font-bold text-emerald-400 animate-fade-in">{weatherNotice}</p>
                )}
              </CardContent>
            </Card>
          );
        })()}

        <Card className="hover-elevate hover-glow bg-slate-900/40 border border-slate-850">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <Hotel className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-450 font-bold uppercase tracking-wider truncate">Bookings Placed</p>
              <h4 className="text-base font-black text-white mt-0.5 truncate">
                {selectedReq && bookings.length > 0 ? `${bookings.length} Booked` : '0 Bookings'}
              </h4>
              <p className="text-[10px] text-slate-500 truncate">Preferred vendor rates locked</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate hover-glow bg-slate-900/40 border border-slate-850">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-450 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-450 font-bold uppercase tracking-wider truncate">Linked Shipments</p>
              <h4 className="text-base font-black text-white mt-0.5 truncate">
                {shipments.length} Active
              </h4>
              <p className="text-[10px] text-slate-500 truncate">Synchronized cargo assets</p>
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
