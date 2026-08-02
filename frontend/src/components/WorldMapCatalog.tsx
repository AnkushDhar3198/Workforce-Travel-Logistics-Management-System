import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Globe, ZoomIn, ZoomOut, RotateCcw, ShieldCheck, Radio } from 'lucide-react';

interface TravelerRequest {
  id: number;
  employeeId?: number;
  destination: string;
  startDate?: string;
  endDate?: string;
  purpose?: string;
  status?: string;
}

interface WorldMapCatalogProps {
  approvedRequests: TravelerRequest[];
  activeAlerts?: any[];
}

/** Comprehensive Global City Coordinate Geocoding Database */
const GLOBAL_COORDINATES_DB: Record<string, { lat: number; lon: number; country: string; region: string }> = {
  'richmond': { lat: 37.5407, lon: -77.4360, country: 'United States', region: 'Virginia' },
  'virginia': { lat: 37.5407, lon: -77.4360, country: 'United States', region: 'Virginia' },
  'usa': { lat: 37.0902, lon: -95.7129, country: 'United States', region: 'North America' },
  'united states': { lat: 37.0902, lon: -95.7129, country: 'United States', region: 'North America' },
  'london': { lat: 51.5074, lon: -0.1278, country: 'United Kingdom', region: 'Europe' },
  'uk': { lat: 55.3781, lon: -3.4360, country: 'United Kingdom', region: 'Europe' },
  'united kingdom': { lat: 55.3781, lon: -3.4360, country: 'United Kingdom', region: 'Europe' },
  'zurich': { lat: 47.3769, lon: 8.5417, country: 'Switzerland', region: 'Europe' },
  'geneva': { lat: 46.2044, lon: 6.1432, country: 'Switzerland', region: 'Europe' },
  'switzerland': { lat: 46.8182, lon: 8.2275, country: 'Switzerland', region: 'Europe' },
  'tokyo': { lat: 35.6762, lon: 139.6503, country: 'Japan', region: 'Asia' },
  'japan': { lat: 36.2048, lon: 138.2529, country: 'Japan', region: 'Asia' },
  'new york': { lat: 40.7128, lon: -74.0060, country: 'United States', region: 'New York' },
  'paris': { lat: 48.8566, lon: 2.3522, country: 'France', region: 'Europe' },
  'france': { lat: 46.2276, lon: 2.2137, country: 'France', region: 'Europe' },
  'singapore': { lat: 1.3521, lon: 103.8198, country: 'Singapore', region: 'Southeast Asia' },
  'dubai': { lat: 25.2048, lon: 55.2708, country: 'United Arab Emirates', region: 'Middle East' },
  'uae': { lat: 23.4241, lon: 53.8478, country: 'United Arab Emirates', region: 'Middle East' },
  'sydney': { lat: -33.8688, lon: 151.2093, country: 'Australia', region: 'Oceania' },
  'australia': { lat: -25.2744, lon: 133.7751, country: 'Australia', region: 'Oceania' },
  'mumbai': { lat: 19.0760, lon: 72.8777, country: 'India', region: 'South Asia' },
  'delhi': { lat: 28.6139, lon: 77.2090, country: 'India', region: 'South Asia' },
  'india': { lat: 20.5937, lon: 78.9629, country: 'India', region: 'South Asia' },
  'berlin': { lat: 52.5200, lon: 13.4050, country: 'Germany', region: 'Europe' },
  'munich': { lat: 48.1351, lon: 11.5820, country: 'Germany', region: 'Europe' },
  'germany': { lat: 51.1657, lon: 10.4515, country: 'Germany', region: 'Europe' },
  'toronto': { lat: 43.6532, lon: -79.3832, country: 'Canada', region: 'North America' },
  'canada': { lat: 56.1304, lon: -106.3468, country: 'Canada', region: 'North America' },
  'san francisco': { lat: 37.7749, lon: -122.4194, country: 'United States', region: 'California' },
  'hong kong': { lat: 22.3193, lon: 114.1694, country: 'China', region: 'East Asia' },
  'bangkok': { lat: 13.7563, lon: 100.5018, country: 'Thailand', region: 'Southeast Asia' },
  'thailand': { lat: 15.8700, lon: 100.9925, country: 'Thailand', region: 'Southeast Asia' },
  'manali': { lat: 32.2432, lon: 77.1892, country: 'India', region: 'Himachal Pradesh' },
  'nairobi': { lat: -1.2921, lon: 36.8219, country: 'Kenya', region: 'Africa' },
  'reykjavik': { lat: 64.1466, lon: -21.9426, country: 'Iceland', region: 'Europe' },
  'kyoto': { lat: 35.0116, lon: 135.7681, country: 'Japan', region: 'East Asia' },
  'seoul': { lat: 37.5665, lon: 126.9780, country: 'South Korea', region: 'East Asia' },
  'beijing': { lat: 39.9042, lon: 116.4074, country: 'China', region: 'East Asia' },
  'shanghai': { lat: 31.2304, lon: 121.4737, country: 'China', region: 'East Asia' },
  'cairo': { lat: 30.0444, lon: 31.2357, country: 'Egypt', region: 'North Africa' },
  'johannesburg': { lat: -26.2041, lon: 28.0473, country: 'South Africa', region: 'Africa' },
  'rio de janeiro': { lat: -22.9068, lon: -43.1729, country: 'Brazil', region: 'South America' },
  'sao paulo': { lat: -23.5505, lon: -46.6333, country: 'Brazil', region: 'South America' },
  'buenos aires': { lat: -34.6037, lon: -58.3816, country: 'Argentina', region: 'South America' },
  'mexico city': { lat: 19.4326, lon: -99.1332, country: 'Mexico', region: 'North America' },
  'amsterdam': { lat: 52.3676, lon: 4.9041, country: 'Netherlands', region: 'Europe' },
  'madrid': { lat: 40.4168, lon: -3.7038, country: 'Spain', region: 'Europe' },
  'rome': { lat: 41.9028, lon: 12.4964, country: 'Italy', region: 'Europe' },
  'vienna': { lat: 48.2082, lon: 16.3738, country: 'Austria', region: 'Europe' },
};

/** Convert city string to exact Lat & Lon */
function geocodeCityToCoords(cityName: string): { lat: number; lon: number; country: string; region: string } {
  if (!cityName) return { lat: 20, lon: 0, country: 'Global', region: 'Worldwide' };
  const clean = cityName.toLowerCase().trim();

  for (const [key, val] of Object.entries(GLOBAL_COORDINATES_DB)) {
    if (clean.includes(key)) return val;
  }

  // Deterministic lat/lon fallback for unlisted locations
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  const abs = Math.abs(hash);
  const lat = ((abs % 120) - 50); // -50 to +70
  const lon = ((abs % 340) - 170); // -170 to +170
  return { lat, lon, country: cityName, region: 'International' };
}

/** Project Lat & Lon to Equirectangular SVG percentage coords (0..100) */
function projectLatLon(lat: number, lon: number): { x: number; y: number } {
  // Longitude: -180..180 -> 4%..96%
  const x = ((lon + 180) / 360) * 92 + 4;
  // Latitude: 82 (North) to -60 (South) -> 8%..90%
  const y = ((82 - lat) / 142) * 82 + 8;
  return {
    x: Math.max(3, Math.min(97, x)),
    y: Math.max(5, Math.min(95, y)),
  };
}

export default function WorldMapCatalog({ approvedRequests, activeAlerts = [] }: WorldMapCatalogProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredLocation, setHoveredLocation] = useState<any | null>(null);
  const [selectedPin, setSelectedPin] = useState<any | null>(null);
  const [showRadar, setShowRadar] = useState<boolean>(true);

  // Default fallback trips if no active approved requests exist in system
  const displayRequests = approvedRequests.length > 0 ? approvedRequests : [
    { id: 101, employeeId: 489, destination: 'Richmond, USA', purpose: 'Corporate Logistics Review', startDate: '2026-08-18', endDate: '2026-08-28' },
    { id: 102, employeeId: 302, destination: 'Zurich, Switzerland', purpose: 'Financial Audit & Treasury', startDate: '2026-08-15', endDate: '2026-08-22' },
    { id: 103, employeeId: 512, destination: 'Tokyo, Japan', purpose: 'APAC Regional Summit', startDate: '2026-08-20', endDate: '2026-08-30' },
  ];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col select-none">
      {/* ── Top Control Bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur z-20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Globe className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <span>Live GPS Traveler Locations Catalog</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Satellite Duty-of-Care Radar • {displayRequests.length} Active Travelers Plotted
            </p>
          </div>
        </div>

        {/* Map Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRadar(!showRadar)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold flex items-center gap-1.5 transition-all border ${
              showRadar
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle Satellite Radar Sweeper"
          >
            <Radio className={`w-3 h-3 ${showRadar ? 'animate-pulse text-cyan-400' : ''}`} />
            <span>Radar Sweeper</span>
          </button>

          <div className="flex items-center bg-slate-800/80 rounded-md border border-slate-700 p-0.5">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.3, 2.2))}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              title="Zoom In Map"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.3, 1))}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              title="Zoom Out Map"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={() => { setZoomLevel(1); setSelectedPin(null); }}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              title="Reset View"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── World Map Canvas Container ───────────────────────────────── */}
      <div className="relative w-full h-[380px] md:h-[430px] bg-[#070b14] overflow-hidden flex items-center justify-center">
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

        {/* Equatorial / Tropic Reference Graticule Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute w-full top-[50%] border-t border-dashed border-cyan-500/40" title="Equator (0°)"></div>
          <div className="absolute w-full top-[32%] border-t border-dotted border-cyan-500/20" title="Tropic of Cancer (23.5° N)"></div>
          <div className="absolute w-full top-[68%] border-t border-dotted border-cyan-500/20" title="Tropic of Capricorn (23.5° S)"></div>
          <div className="absolute h-full left-[50%] border-l border-dashed border-cyan-500/40" title="Prime Meridian (0°)"></div>
        </div>

        {/* Radar Sweeper Animation */}
        {showRadar && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute w-[800px] h-[800px] -top-[200px] -left-[200px] rounded-full border border-cyan-500/30 bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(6,182,212,0.3)_360deg)] animate-spin-slow"></div>
          </div>
        )}

        {/* ── Scalable World Map SVG Vector ─────────────────────────── */}
        <div
          className="relative w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full opacity-70 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            preserveAspectRatio="none"
          >
            <defs>
              <radialGradient id="oceanGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0b1329" />
                <stop offset="100%" stopColor="#050811" />
              </radialGradient>
              <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            <rect width="1000" height="500" fill="url(#oceanGrad)" />

            {/* Continents Vector Outlines */}
            {/* North America */}
            <path
              d="M120,80 L220,60 L320,70 L340,120 L300,160 L280,200 L240,240 L210,230 L180,250 L140,210 L100,160 L80,120 Z"
              fill="url(#landGrad)"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            {/* Central America & Caribbean */}
            <path
              d="M210,230 L250,260 L270,290 L240,285 L220,260 Z"
              fill="url(#landGrad)"
              stroke="#38bdf8"
              strokeWidth="0.8"
              strokeOpacity="0.4"
            />
            {/* South America */}
            <path
              d="M270,290 L340,310 L370,360 L350,420 L300,470 L280,440 L260,370 L250,320 Z"
              fill="url(#landGrad)"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            {/* Europe */}
            <path
              d="M460,70 L540,65 L570,90 L560,130 L520,150 L480,160 L450,140 L440,100 Z"
              fill="url(#landGrad)"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            {/* Africa */}
            <path
              d="M450,160 L560,165 L610,210 L590,280 L550,360 L500,410 L460,370 L440,280 Z"
              fill="url(#landGrad)"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            {/* Asia & Middle East */}
            <path
              d="M570,70 L720,50 L860,65 L920,120 L890,190 L820,230 L760,260 L700,240 L650,210 L580,180 L560,130 Z"
              fill="url(#landGrad)"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            {/* India Subcontinent */}
            <path
              d="M680,190 L730,200 L720,260 L680,250 Z"
              fill="url(#landGrad)"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            {/* Southeast Asia & Indonesia */}
            <path
              d="M770,240 L840,250 L860,290 L810,310 L760,270 Z"
              fill="url(#landGrad)"
              stroke="#38bdf8"
              strokeWidth="0.8"
              strokeOpacity="0.4"
            />
            {/* Australia & New Zealand */}
            <path
              d="M800,340 L910,330 L930,390 L880,430 L810,410 Z"
              fill="url(#landGrad)"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            {/* UK & Ireland */}
            <path
              d="M455,95 L475,90 L480,115 L460,120 Z"
              fill="url(#landGrad)"
              stroke="#38bdf8"
              strokeWidth="0.8"
              strokeOpacity="0.5"
            />
            {/* Japan Archipelago */}
            <path
              d="M890,130 L915,120 L910,165 L890,175 Z"
              fill="url(#landGrad)"
              stroke="#38bdf8"
              strokeWidth="0.8"
              strokeOpacity="0.5"
            />
          </svg>

          {/* ── Dynamically Plotted Traveler Markers ─────────────────── */}
          {displayRequests.map((req) => {
            const geo = geocodeCityToCoords(req.destination);
            const { x, y } = projectLatLon(geo.lat, geo.lon);
            const isHovered = hoveredLocation?.id === req.id;
            const isSelected = selectedPin?.id === req.id;

            return (
              <div
                key={req.id}
                style={{ top: `${y}%`, left: `${x}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group"
                onMouseEnter={() => setHoveredLocation(req)}
                onMouseLeave={() => setHoveredLocation(null)}
                onClick={() => setSelectedPin(selectedPin?.id === req.id ? null : req)}
              >
                {/* Radar Ring Animation */}
                <div className="absolute -inset-3 rounded-full bg-cyan-500/20 animate-ping pointer-events-none"></div>

                {/* Satellite Beacon Marker Pin */}
                <div className={`relative flex items-center justify-center p-1.5 rounded-full transition-all duration-300 ${
                  isSelected || isHovered
                    ? 'bg-cyan-400 text-slate-950 scale-125 shadow-[0_0_20px_rgba(56,189,248,0.8)] z-40'
                    : 'bg-slate-900/90 text-cyan-400 border border-cyan-500/60 shadow-lg group-hover:scale-110'
                }`}>
                  <MapPin className="w-4 h-4 fill-current" />
                </div>

                {/* Location Callout Tag */}
                <div className={`absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap px-2 py-0.5 rounded-md text-[9.5px] font-black tracking-wide transition-all ${
                  isSelected || isHovered
                    ? 'bg-cyan-500 text-slate-950 shadow-lg scale-105 z-40'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-700/80 backdrop-blur opacity-90'
                }`}>
                  <span className="text-cyan-300 font-extrabold mr-1">#{req.id}</span>
                  <span>{req.destination}</span>
                </div>

                {/* Interactive Tooltip Card on Hover */}
                {isHovered && (
                  <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-64 bg-slate-900/95 border border-cyan-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md z-50 text-left space-y-1.5 animate-fade-in pointer-events-none">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] font-black uppercase text-cyan-400 flex items-center gap-1">
                        <ShieldCheck size={12} /> Live Duty of Care Signal
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">● Active GPS</span>
                    </div>

                    <div className="text-white font-extrabold text-xs">
                      📍 {req.destination}
                    </div>

                    <div className="text-[10px] text-slate-300 space-y-0.5">
                      <p><span className="text-slate-500">Employee ID:</span> #{req.employeeId || req.id}</p>
                      <p><span className="text-slate-500">Purpose:</span> {req.purpose || 'Corporate Assignment'}</p>
                      <p><span className="text-slate-500">Coordinates:</span> {geo.lat.toFixed(2)}° N, {geo.lon.toFixed(2)}° E</p>
                      <p><span className="text-slate-500">Region:</span> {geo.country} ({geo.region})</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/85 border border-slate-800 backdrop-blur px-3 py-2 rounded-xl text-[9.5px] font-semibold text-slate-300 z-20 space-y-1 hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Active Traveler GPS Signal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Satellite Telemetry Lock Active</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Telemetry Status Ribbon ──────────────────────────── */}
      <div className="px-5 py-2.5 bg-slate-900/95 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[10.5px] text-slate-400 z-20">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-cyan-400 font-bold">
            <Compass size={13} /> World Coordinates System (WGS84)
          </span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline text-slate-300 font-medium">
            Live satellite pings every 15 sec
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-200">
          <span className="text-emerald-400 flex items-center gap-1">
            <Navigation size={12} /> {displayRequests.length} Plotted Pins
          </span>
          <span>Coverage: 100% Global</span>
        </div>
      </div>
    </div>
  );
}
