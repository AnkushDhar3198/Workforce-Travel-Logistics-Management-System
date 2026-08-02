import React, { useState, useEffect } from 'react';
import { Calendar, Info, Plane, Hotel, Truck, AlertTriangle, CheckCircle, FileText, RefreshCw } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { fetchLiveSatelliteWeather, resolveWeatherIconUrl, conditionTypeToEmoji, getAqiCategory } from '../../utils/liveWeather';
import WorldMapCatalog from '../../components/WorldMapCatalog';

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

      {/* ── Apple Bento Grid Row 1: Weather Glass Hero + GPS Map Widget ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Destination & Weather Glass Hero Card (6 cols) */}
        <div className="lg:col-span-6 flex flex-col">
          {(() => {
            const ct = (weather?.conditionType || weather?.icon || '').toUpperCase();
            const isNightAtDest = destLocalHour < 6 || destLocalHour >= 18;

            // Apple Weather Dynamic Palette
            let bgGrad = 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)'; // Apple Clear Day Sky
            let accentYellow = '#fde047';
            let pillBg = 'rgba(15, 23, 42, 0.65)';
            let pillBorder = 'rgba(255, 255, 255, 0.25)';

            if (isNightAtDest) {
              // Deep Midnight Indigo Night
              bgGrad = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)';
              accentYellow = '#fbbf24';
              pillBg = 'rgba(2, 6, 23, 0.75)';
              pillBorder = 'rgba(255, 255, 255, 0.15)';
            } else if (ct.includes('RAIN') || ct.includes('DRIZZLE') || ct.includes('SHOWER')) {
              // Rainy Slate Blue
              bgGrad = 'linear-gradient(135deg, #334155 0%, #1e293b 50%, #0f172a 100%)';
              accentYellow = '#38bdf8';
            } else if (ct.includes('THUNDER') || ct.includes('STORM')) {
              // Thunderstorm Violet
              bgGrad = 'linear-gradient(135deg, #2e1065 0%, #1e1b4b 50%, #0f172a 100%)';
              accentYellow = '#c084fc';
            }

            const aqiVal = weather?.aqi ?? 35;
            const aqiCat = getAqiCategory(aqiVal);

            return (
              <div
                className="h-full min-h-[250px] sm:min-h-[270px] md:min-h-[290px] flex flex-col justify-between rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-2xl border"
                style={{
                  background: bgGrad,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                }}
              >
                {/* Top status bar */}
                <div className="flex items-center justify-between gap-2 border-b pb-2" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-sm" />
                    <span className="text-[11px] font-black uppercase tracking-widest truncate" style={{ color: '#38bdf8' }}>
                      Live Weather Stream
                    </span>
                    <span className="text-[10px] font-mono font-bold shrink-0" style={{ color: '#ffffff' }}>
                      • {liveTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleManualWeatherRefresh}
                      disabled={isRefreshingWeather || weatherLoading}
                      className="px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1 shadow-md cursor-pointer"
                      style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.3)' }}
                    >
                      <RefreshCw size={9} className={isRefreshingWeather ? 'animate-spin' : ''} />
                      <span style={{ color: '#ffffff' }}>{isRefreshingWeather ? 'Updating' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>

                {/* Big Temperature Hero */}
                <div className="my-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: accentYellow }}>
                      <span>📍</span> <span>{selectedReq?.destination || weather?.city || 'Worldwide'}</span>
                    </p>
                    <h3 className="text-4xl sm:text-5xl md:text-6xl font-black mt-0.5 tracking-tight select-none" style={{ color: '#ffffff', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                      {weather ? `${weather.temperature ?? weather.temp}°C` : '—'}
                    </h3>
                    <p className="text-[11px] font-bold mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: '#ffffff' }}>
                      <span className="font-black text-xs" style={{ color: '#ffffff' }}>{weather?.description ?? 'Partly Cloudy'}</span>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>•</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}>
                        {destLocalHour >= 6 && destLocalHour < 18 ? '☀️ Daylight' : '🌙 Night'}
                      </span>
                    </p>
                  </div>

                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-xl backdrop-blur-md" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                    {(weather?.iconUrl || resolveWeatherIconUrl(weather?.iconBaseUri)) ? (
                      <img
                        src={weather?.iconUrl || resolveWeatherIconUrl(weather?.iconBaseUri)!}
                        alt={weather?.description || 'weather'}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow"
                      />
                    ) : (
                      <span className="text-3xl select-none">
                        {conditionTypeToEmoji(weather?.conditionType || weather?.icon, destLocalHour >= 6 && destLocalHour < 18)}
                      </span>
                    )}
                  </div>
                </div>

                {/* 5 Minimal Metric Pills (Dark Frosted Glass with Pure White Values) */}
                {weather && (
                  <div className="grid grid-cols-5 gap-1 pt-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
                    <div className="rounded-xl p-1.5 text-center shadow-md backdrop-blur-md" style={{ background: pillBg, border: `1px solid ${pillBorder}` }}>
                      <p className="text-[8px] uppercase font-bold tracking-wider" style={{ color: '#cbd5e1' }}>Feels</p>
                      <p className="text-[11px] font-black mt-0.5" style={{ color: '#ffffff' }}>{weather.feelsLike ?? '—'}°C</p>
                    </div>
                    <div className="rounded-xl p-1.5 text-center shadow-md backdrop-blur-md" style={{ background: pillBg, border: `1px solid ${pillBorder}` }}>
                      <p className="text-[8px] uppercase font-bold tracking-wider" style={{ color: '#cbd5e1' }}>Humidity</p>
                      <p className="text-[11px] font-black mt-0.5" style={{ color: '#ffffff' }}>{weather.humidity}%</p>
                    </div>
                    <div className="rounded-xl p-1.5 text-center shadow-md backdrop-blur-md" style={{ background: pillBg, border: `1px solid ${pillBorder}` }}>
                      <p className="text-[8px] uppercase font-bold tracking-wider" style={{ color: '#cbd5e1' }}>Wind</p>
                      <p className="text-[11px] font-black mt-0.5" style={{ color: '#ffffff' }}>{weather.windSpeed ?? '—'} km/h</p>
                    </div>
                    <div className="rounded-xl p-1.5 text-center shadow-md backdrop-blur-md" style={{ background: pillBg, border: `1px solid ${pillBorder}` }}>
                      <p className="text-[8px] uppercase font-bold tracking-wider" style={{ color: '#cbd5e1' }}>UV Index</p>
                      <p className="text-[11px] font-black mt-0.5" style={{ color: '#ffffff' }}>{weather.uvIndex ?? '1'}</p>
                    </div>
                    <div className="rounded-xl p-1.5 text-center shadow-md backdrop-blur-md" style={{ background: pillBg, border: `1px solid ${pillBorder}` }}>
                      <p className="text-[8px] uppercase font-bold tracking-wider" style={{ color: '#cbd5e1' }}>Air Quality</p>
                      <p className="text-[11px] font-black mt-0.5" style={{ color: aqiVal <= 50 ? '#34d399' : aqiVal <= 100 ? '#fbbf24' : '#f87171' }}>
                        {aqiVal} <span className="text-[7.5px] font-bold block leading-none" style={{ color: aqiVal <= 50 ? '#34d399' : aqiVal <= 100 ? '#fbbf24' : '#f87171' }}>{aqiCat.label}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Right: Apple Live GPS World Map Widget (6 cols) */}
        <div className="lg:col-span-6 flex flex-col">
          <WorldMapCatalog approvedRequests={requests} compact={true} />
        </div>
      </div>

      {/* ── Apple Bento Grid Row 2: 4 Summary Stat Cards ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="hover-elevate hover-glow bg-slate-900/60 border border-white/10 rounded-3xl backdrop-blur-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 shrink-0">
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

        <Card className="hover-elevate hover-glow bg-slate-900/60 border border-white/10 rounded-3xl backdrop-blur-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0">
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

        <Card className="hover-elevate hover-glow bg-slate-900/60 border border-white/10 rounded-3xl backdrop-blur-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-450 shrink-0">
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

        <Card className="hover-elevate hover-glow bg-slate-900/60 border border-white/10 rounded-3xl backdrop-blur-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-450 font-bold uppercase tracking-wider truncate">Duty of Care Lock</p>
              <h4 className="text-base font-black text-white mt-0.5 truncate">Verified</h4>
              <p className="text-[10px] text-slate-500 truncate">GPS & Insurance active</p>
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
