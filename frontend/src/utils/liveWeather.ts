import { API_BASE } from '../context/AuthContext';

export interface LiveWeatherData {
  city: string;
  country?: string;
  temperature: number;
  temp: number;
  feelsLike?: number;
  description: string;
  humidity: number;
  dewPoint?: number;
  uvIndex?: number;
  windSpeed?: number;
  windDegrees?: number;
  windCardinal?: string;
  windGust?: number;
  visibility?: number;
  icon: string;
  iconUrl?: string;          // Direct weather icon URL (WeatherAPI.com / OpenWeatherMap)
  iconBaseUri?: string;      // Google Maps iconBaseUri — append .png or _dark.png
  conditionType?: string;    // Google Maps condition type e.g. CLEAR, PARTLY_CLOUDY
  isDaytime?: boolean;
  timezone?: string;
  currentTime?: string;
  isLive: boolean;
  provider: string;
  lastUpdated: string;
  minuteForecast?: {
    hasPrecipitationNext60Min: boolean;
    precipitationType: string;
    maxPrecipLikelihood: number;       // 0–100 percent
  };
}

/**
 * Resolves the correct Google Maps weather icon URL.
 * - Light/default: iconBaseUri + ".png"
 * - Dark theme:    iconBaseUri + "_dark.png"
 */
export function resolveWeatherIconUrl(iconBaseUri: string | undefined, dark = false): string | null {
  if (!iconBaseUri) return null;
  return dark ? `${iconBaseUri}_dark.png` : `${iconBaseUri}.png`;
}

/**
 * Maps a Google Maps conditionType string to an emoji for compact display.
 */
export function conditionTypeToEmoji(conditionType?: string, isDaytime = true): string {
  const t = (conditionType || '').toUpperCase();
  if (t === 'CLEAR' || t === 'MOSTLY_CLEAR') return isDaytime ? '☀️' : '🌙';
  if (t === 'PARTLY_CLOUDY') return isDaytime ? '⛅' : '🌤️';
  if (t === 'MOSTLY_CLOUDY') return '🌥️';
  if (t === 'CLOUDY' || t === 'OVERCAST') return '☁️';
  if (t.includes('THUNDER') || t.includes('STORM')) return '⛈️';
  if (t.includes('HEAVY_RAIN') || t.includes('HEAVY_SHOWER')) return '🌧️';
  if (t.includes('RAIN') || t.includes('SHOWER') || t.includes('DRIZZLE')) return '🌦️';
  if (t.includes('SNOW') || t.includes('BLIZZARD') || t.includes('ICE') || t.includes('SLEET')) return '❄️';
  if (t.includes('FOG') || t.includes('MIST') || t.includes('HAZE') || t.includes('DUST') || t.includes('SMOKE')) return '🌫️';
  if (t === 'WINDY' || t === 'WIND_AND_RAIN') return '💨';
  // Legacy OWM icon code fallback
  if (t.startsWith('01')) return isDaytime ? '☀️' : '🌙';
  if (t.startsWith('02') || t.startsWith('03')) return '⛅';
  if (t.startsWith('04')) return '☁️';
  if (t.startsWith('09') || t.startsWith('10')) return '🌧️';
  if (t.startsWith('11')) return '⛈️';
  if (t.startsWith('13')) return '❄️';
  if (t.startsWith('50')) return '🌫️';
  return '🌤️';
}

/**
 * Fetch real-time weather via Google Maps Platform Weather API.
 * Routed through backend proxy at /api/weather/current?city=<city>
 */
export async function fetchLiveSatelliteWeather(locationQuery: string): Promise<LiveWeatherData> {
  const query = locationQuery && locationQuery.trim() ? locationQuery.trim() : 'Manali';

  try {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/weather/current?city=${encodeURIComponent(query)}`, { headers });
    if (res.ok) {
      const d = await res.json();
      if (d && (d.temperature !== undefined || d.temp !== undefined)) {
        const tempVal = d.temperature ?? d.temp;
        return {
          city: d.city || query,
          temperature: Math.round(tempVal),
          temp: Math.round(tempVal),
          feelsLike: d.feelsLike != null ? Math.round(d.feelsLike) : Math.round(tempVal),
          description: d.condition || d.description || 'Partly Cloudy',
          humidity: Math.round(d.humidity ?? 70),
          dewPoint: d.dewPoint != null ? Math.round(d.dewPoint) : undefined,
          uvIndex: d.uvIndex,
          windSpeed: d.windSpeed != null ? Math.round(d.windSpeed) : undefined,
          windDegrees: d.windDegrees,
          windCardinal: d.windCardinal,
          windGust: d.windGust != null ? Math.round(d.windGust) : undefined,
          visibility: d.visibility,
          icon: d.icon || '02d',
          iconUrl: d.iconUrl,
          iconBaseUri: d.iconBaseUri,
          conditionType: d.conditionType,
          isDaytime: d.isDaytime !== undefined ? d.isDaytime : true,
          timezone: d.timezone,
          currentTime: d.currentTime,
          isLive: d.isLive ?? true,
          provider: d.source || 'Live Station Observation · wttr.in',
          lastUpdated: d.lastUpdated || new Date().toLocaleTimeString(),
          minuteForecast: d.minuteForecast,
        };
      }
    }
    throw new Error(`Weather endpoint returned HTTP status ${res.status}`);
  } catch (err) {
    console.error('[LiveWeather] Failed to fetch live weather stream:', err);
    throw err;
  }
}

/** Initial weather state for a given location */
export function getWeatherForLocation(location: string): LiveWeatherData {
  const city = location && location.trim() ? location.trim() : 'Manali';
  return {
    city,
    temperature: 17,
    temp: 17,
    feelsLike: 17,
    description: 'Partly Cloudy',
    humidity: 70,
    windSpeed: 5,
    icon: '02d',
    conditionType: 'PARTLY_CLOUDY',
    isDaytime: true,
    isLive: true,
    provider: 'Google Maps Platform Weather API',
    lastUpdated: new Date().toLocaleTimeString(),
  };
}
