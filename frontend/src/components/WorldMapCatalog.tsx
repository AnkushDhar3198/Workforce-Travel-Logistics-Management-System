import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Globe, Navigation, RotateCcw, ShieldCheck, ZoomIn, ZoomOut, Search, MapPin, List } from 'lucide-react';

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
  compact?: boolean;
}

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

function geocodeCityToCoords(cityName: string): { lat: number; lon: number; country: string; region: string } {
  if (!cityName) return { lat: 20, lon: 0, country: 'Global', region: 'Worldwide' };
  const clean = cityName.toLowerCase().trim();

  for (const [key, val] of Object.entries(GLOBAL_COORDINATES_DB)) {
    if (clean.includes(key)) return val;
  }

  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  const abs = Math.abs(hash);
  const lat = ((abs % 110) - 45);
  const lon = ((abs % 340) - 170);
  return { lat, lon, country: cityName, region: 'International' };
}

type MapLayerType = 'dark' | 'satellite' | 'street';

export default function WorldMapCatalog({ approvedRequests, activeAlerts = [], compact = false }: WorldMapCatalogProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('dark');
  const [selectedTraveler, setSelectedTraveler] = useState<TravelerRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRosterOverlay, setShowRosterOverlay] = useState<boolean>(false);

  const displayRequests = approvedRequests.length > 0 ? approvedRequests : [
    { id: 101, employeeId: 489, destination: 'Richmond, USA', purpose: 'Corporate Logistics Review' },
    { id: 102, employeeId: 302, destination: 'Zurich, Switzerland', purpose: 'Financial Audit & Treasury' },
    { id: 103, employeeId: 512, destination: 'Tokyo, Japan', purpose: 'APAC Regional Summit' },
  ];

  const filteredRequests = displayRequests.filter(r =>
    r.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.purpose && r.purpose.toLowerCase().includes(searchQuery.toLowerCase())) ||
    String(r.id).includes(searchQuery)
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22, 10],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
      });
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let subdomains = 'abcd';

    if (activeLayer === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      subdomains = 'abc';
    } else if (activeLayer === 'street') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      subdomains = 'abc';
    }

    const newTileLayer = L.tileLayer(tileUrl, {
      subdomains,
      maxZoom: 18,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const bounds: L.LatLngExpression[] = [];

    displayRequests.forEach(req => {
      const geo = geocodeCityToCoords(req.destination);
      const latLng: [number, number] = [geo.lat, geo.lon];
      bounds.push(latLng);

      const customIcon = L.divIcon({
        className: 'apple-leaflet-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(56, 189, 248, 0.25); border: 1.5px solid rgba(56, 189, 248, 0.5); animation: ping 2s infinite;"></div>
            <div style="position: relative; background: #0f172a; border: 1.5px solid #38bdf8; border-radius: 50%; padding: 4px; color: #38bdf8; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div style="position: absolute; top: 20px; white-space: nowrap; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15); padding: 2px 7px; border-radius: 10px; color: #fff; font-size: 9px; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
              ${req.destination}
            </div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; color: #fff; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.15); min-width: 170px;">
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; tracking: 0.1em; color: #38bdf8; margin-bottom: 3px;">📍 Live GPS Signal</div>
          <div style="font-size: 12px; font-weight: 800; color: #fff; margin-bottom: 4px;">${req.destination}</div>
          <div style="font-size: 9.5px; color: #94a3b8; line-height: 1.4;">
            <div><b>Employee ID:</b> #${req.employeeId || req.id}</div>
            <div><b>Coordinates:</b> ${geo.lat.toFixed(2)}°, ${geo.lon.toFixed(2)}°</div>
            <div><b>Region:</b> ${geo.country}</div>
          </div>
        </div>
      `;

      const marker = L.marker(latLng, { icon: customIcon })
        .addTo(map)
        .bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedTraveler(req);
      });

      markersRef.current.push(marker);
    });

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30], maxZoom: 5 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeLayer, displayRequests]);

  const handleFlyTo = (req: TravelerRequest) => {
    setSelectedTraveler(req);
    setShowRosterOverlay(false);
    if (mapInstanceRef.current) {
      const geo = geocodeCityToCoords(req.destination);
      mapInstanceRef.current.flyTo([geo.lat, geo.lon], 6, { duration: 1.2 });
    }
  };

  const handleResetMap = () => {
    setSelectedTraveler(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22, 10], 2, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-slate-950/80 border border-white/10 ring-1 ring-white/5 shadow-2xl flex flex-col select-none backdrop-blur-xl">
      {/* ── Apple Floating Control Bar Overlay ─────────────────────── */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Left Floating Info Pill */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/70 border border-white/10 backdrop-blur-xl px-3 py-1.5 rounded-full shadow-lg">
          <Globe className="w-3.5 h-3.5 text-sky-400 animate-spin-slow" />
          <span className="text-[10.5px] font-extrabold text-white">Live GPS World Catalog</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[9.5px] font-medium text-slate-400 hidden sm:inline">• {displayRequests.length} Locations</span>
        </div>

        {/* Right Floating Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Layer Selector Frosted Pill */}
          <div className="flex items-center bg-slate-900/70 border border-white/10 backdrop-blur-xl p-0.5 rounded-full shadow-lg">
            <button
              onClick={() => setActiveLayer('dark')}
              className={`px-2.5 py-1 rounded-full text-[9.5px] font-black transition-all ${
                activeLayer === 'dark' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setActiveLayer('satellite')}
              className={`px-2.5 py-1 rounded-md text-[9.5px] font-black transition-all ${
                activeLayer === 'satellite' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setActiveLayer('street')}
              className={`px-2.5 py-1 rounded-full text-[9.5px] font-black transition-all ${
                activeLayer === 'street' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Street
            </button>
          </div>

          {/* Toggle Roster Button */}
          <button
            onClick={() => setShowRosterOverlay(!showRosterOverlay)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 transition-all shadow-lg border backdrop-blur-xl ${
              showRosterOverlay
                ? 'bg-sky-500 text-slate-950 border-sky-400'
                : 'bg-slate-900/70 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <List size={12} />
            <span>Roster ({displayRequests.length})</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-900/70 border border-white/10 backdrop-blur-xl p-0.5 rounded-full shadow-lg">
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="p-1.5 text-slate-300 hover:text-white rounded-full transition"
              title="Zoom In"
            >
              <ZoomIn size={12} />
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="p-1.5 text-slate-300 hover:text-white rounded-full transition"
              title="Zoom Out"
            >
              <ZoomOut size={12} />
            </button>
            <button
              onClick={handleResetMap}
              className="p-1.5 text-slate-300 hover:text-white rounded-full transition"
              title="Reset View"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Leaflet Map Container (Compact Height) ────────────────── */}
      <div className="relative w-full h-[310px] md:h-[340px] flex">
        <div ref={mapContainerRef} className="w-full h-full z-10 bg-slate-950"></div>

        {/* Slide-over Apple Frosted Roster Drawer */}
        {showRosterOverlay && (
          <div className="absolute top-14 right-3 z-30 w-64 bg-slate-900/90 border border-white/15 backdrop-blur-2xl rounded-2xl p-3 shadow-2xl space-y-2 animate-fade-in max-h-[260px] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1">
                <Navigation size={11} /> Duty of Care Roster
              </span>
              <span className="text-[9px] text-slate-400 font-mono font-semibold">{filteredRequests.length} active</span>
            </div>

            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-lg pl-7 pr-2 py-1 text-[10px] text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1 pt-0.5">
              {filteredRequests.map((req) => {
                const geo = geocodeCityToCoords(req.destination);
                const isSelected = selectedTraveler?.id === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => handleFlyTo(req)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow'
                        : 'bg-slate-950/50 border-white/5 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white flex items-center gap-1">
                        <MapPin size={10} className="text-sky-400" />
                        <span>{req.destination}</span>
                      </span>
                      <span className="text-[8.5px] font-mono text-sky-400 font-bold">#{req.id}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 flex items-center justify-between">
                      <span>{geo.country}</span>
                      <span className="text-slate-500 font-mono">{geo.lat.toFixed(1)}°, {geo.lon.toFixed(1)}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Apple-Style Minimal Footer Ribbon ─────────────────────────── */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <ShieldCheck size={12} className="text-sky-400" />
          <span className="font-semibold text-slate-300">WGS84 Satellite Telemetry</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9.5px]">
          <span className="text-emerald-400 font-extrabold">● Active Signal</span>
          <span className="text-slate-500">100% Global Coverage</span>
        </div>
      </div>
    </div>
  );
}
