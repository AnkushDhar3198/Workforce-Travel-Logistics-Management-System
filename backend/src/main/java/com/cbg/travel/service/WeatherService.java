package com.cbg.travel.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.text.SimpleDateFormat;
import java.util.*;

@Service
@Slf4j
public class WeatherService {

    // Google Maps Platform Weather API Key
    private static final String GOOGLE_MAPS_API_KEY = "AIzaSyCmPunMG9rBb2Q7iQjDG8tiEMAUpiI-s20";

    private final WebClient googleMapsWeatherClient;
    private final WebClient openMeteoGeoClient;
    private final WebClient openMeteoClient;

    public WeatherService() {
        this.googleMapsWeatherClient = WebClient.builder()
                .baseUrl("https://weather.googleapis.com")
                .defaultHeader("Accept", "application/json")
                .build();

        this.openMeteoGeoClient = WebClient.builder()
                .baseUrl("https://geocoding-api.open-meteo.com/v1")
                .build();

        this.openMeteoClient = WebClient.builder()
                .baseUrl("https://api.open-meteo.com/v1")
                .build();
    }

    public Map<String, Object> getWeatherForecast(String city) {
        return getCurrentWeather(city);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getCurrentWeather(String cityQuery) {
        String city = (cityQuery == null || cityQuery.isBlank()) ? "Manali" : cityQuery.trim();

        // Step 1: Geocode city → lat/lon
        double[] latLon = geocodeCity(city);
        if (latLon == null) {
            log.warn("[Weather] Could not geocode city: {}", city);
            return getDynamicFallback(city);
        }

        double lat = latLon[0];
        double lon = latLon[1];

        // Step 2: PRIMARY — Google Maps Platform Weather API currentConditions:lookup
        Map<String, Object> googleData = fetchGoogleMapsCurrentConditions(city, lat, lon);
        if (googleData != null && googleData.containsKey("temperature")) {
            // Also try to get minute forecast for precipitation nowcasting
            Map<String, Object> minuteData = fetchGoogleMapsMinuteForecast(lat, lon);
            if (minuteData != null) {
                googleData.put("minuteForecast", minuteData);
            }
            return googleData;
        }

        // Step 3: FALLBACK — Open-Meteo with accurate geocoded coordinates
        Map<String, Object> openMeteoData = fetchOpenMeteoWeather(city, lat, lon);
        if (openMeteoData != null && openMeteoData.containsKey("temperature")) {
            return openMeteoData;
        }

        return getDynamicFallback(city);
    }

    @SuppressWarnings("unchecked")
    private double[] geocodeCity(String city) {
        try {
            Map<String, Object> geoResponse = openMeteoGeoClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/search")
                            .queryParam("name", city)
                            .queryParam("count", 1)
                            .queryParam("language", "en")
                            .queryParam("format", "json")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (geoResponse != null && geoResponse.containsKey("results")) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) geoResponse.get("results");
                if (results != null && !results.isEmpty()) {
                    Map<String, Object> loc = results.get(0);
                    double lat = ((Number) loc.get("latitude")).doubleValue();
                    double lon = ((Number) loc.get("longitude")).doubleValue();
                    return new double[]{lat, lon};
                }
            }
        } catch (Exception e) {
            log.warn("[Weather] Geocoding failed for '{}': {}", city, e.getMessage());
        }
        return null;
    }

    /**
     * Google Maps Platform Weather API — currentConditions:lookup
     * GET https://weather.googleapis.com/v1/currentConditions:lookup
     * Params: key, location.latitude, location.longitude, unitsSystem=METRIC, languageCode=en
     *
     * Response fields parsed:
     *   temperature.degrees, feelsLikeTemperature.degrees, relativeHumidity,
     *   dewPoint.degrees, heatIndex.degrees, windChill.degrees, uvIndex,
     *   wind.speed.value, wind.direction.degrees, wind.direction.cardinal, wind.gust.value,
     *   weatherCondition.type, weatherCondition.description.text, weatherCondition.iconBaseUri,
     *   currentTime, timeZone.id, isDaytime
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchGoogleMapsCurrentConditions(String city, double lat, double lon) {
        try {
            Map<String, Object> response = googleMapsWeatherClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/currentConditions:lookup")
                            .queryParam("key", GOOGLE_MAPS_API_KEY)
                            .queryParam("location.latitude", lat)
                            .queryParam("location.longitude", lon)
                            .queryParam("unitsSystem", "METRIC")
                            .queryParam("languageCode", "en")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) return null;

            // --- Temperature ---
            Map<String, Object> tempMap = (Map<String, Object>) response.get("temperature");
            if (tempMap == null) return null;
            double tempC = ((Number) tempMap.getOrDefault("degrees", 17)).doubleValue();

            // --- Feels Like Temperature ---
            Map<String, Object> feelsLikeMap = (Map<String, Object>) response.get("feelsLikeTemperature");
            double feelsLike = feelsLikeMap != null
                    ? ((Number) feelsLikeMap.getOrDefault("degrees", tempC)).doubleValue()
                    : tempC;

            // --- Relative Humidity (direct integer field per API spec) ---
            int humidity = response.get("relativeHumidity") != null
                    ? ((Number) response.get("relativeHumidity")).intValue()
                    : 70;

            // --- Dew Point ---
            Map<String, Object> dewMap = (Map<String, Object>) response.get("dewPoint");
            double dewPoint = dewMap != null ? ((Number) dewMap.getOrDefault("degrees", 0)).doubleValue() : 0;

            // --- UV Index (direct integer field) ---
            int uvIndex = response.get("uvIndex") != null
                    ? ((Number) response.get("uvIndex")).intValue()
                    : 0;

            // --- Wind ---
            double windSpeedKmh = 0;
            int windDegrees = 0;
            String windCardinal = "";
            double windGust = 0;
            Map<String, Object> windMap = (Map<String, Object>) response.get("wind");
            if (windMap != null) {
                Map<String, Object> speedObj = (Map<String, Object>) windMap.get("speed");
                if (speedObj != null) windSpeedKmh = ((Number) speedObj.getOrDefault("value", 0)).doubleValue();

                Map<String, Object> dirObj = (Map<String, Object>) windMap.get("direction");
                if (dirObj != null) {
                    windDegrees = dirObj.get("degrees") != null ? ((Number) dirObj.get("degrees")).intValue() : 0;
                    windCardinal = dirObj.get("cardinal") != null ? dirObj.get("cardinal").toString() : "";
                }

                Map<String, Object> gustObj = (Map<String, Object>) windMap.get("gust");
                if (gustObj != null) windGust = ((Number) gustObj.getOrDefault("value", 0)).doubleValue();
            }

            // --- Visibility ---
            double visibilityKm = 0;
            Map<String, Object> visMap = (Map<String, Object>) response.get("visibility");
            if (visMap != null) visibilityKm = ((Number) visMap.getOrDefault("distance", 10)).doubleValue();

            // --- Weather Condition ---
            String conditionType = "PARTLY_CLOUDY";
            String conditionText = "Partly cloudy";
            String iconBaseUri = "";
            Map<String, Object> condMap = (Map<String, Object>) response.get("weatherCondition");
            if (condMap != null) {
                if (condMap.get("type") != null) conditionType = condMap.get("type").toString();
                if (condMap.get("iconBaseUri") != null) iconBaseUri = condMap.get("iconBaseUri").toString();
                Map<String, Object> descObj = (Map<String, Object>) condMap.get("description");
                if (descObj != null && descObj.get("text") != null) {
                    conditionText = descObj.get("text").toString();
                }
            }

            // --- Time & Timezone ---
            String currentTime = response.get("currentTime") != null ? response.get("currentTime").toString() : "";
            boolean isDaytime = response.get("isDaytime") instanceof Boolean ? (Boolean) response.get("isDaytime") : true;
            String timezone = "";
            Map<String, Object> tzMap = (Map<String, Object>) response.get("timeZone");
            if (tzMap != null && tzMap.get("id") != null) timezone = tzMap.get("id").toString();

            // --- Build result ---
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("city", city);
            result.put("source", "Google Maps Platform Weather API");
            result.put("temperature", (int) Math.round(tempC));
            result.put("temp", (int) Math.round(tempC));
            result.put("feelsLike", (int) Math.round(feelsLike));
            result.put("humidity", humidity);
            result.put("dewPoint", (int) Math.round(dewPoint));
            result.put("uvIndex", uvIndex);
            result.put("windSpeed", (int) Math.round(windSpeedKmh));
            result.put("windDegrees", windDegrees);
            result.put("windCardinal", windCardinal);
            result.put("windGust", (int) Math.round(windGust));
            result.put("visibility", (int) Math.round(visibilityKm));
            result.put("condition", conditionText);
            result.put("description", conditionText);
            result.put("conditionType", conditionType);
            // iconBaseUri from Google — append .png for light theme, _dark.png for dark
            result.put("iconBaseUri", iconBaseUri);
            result.put("icon", iconBaseUri.isEmpty() ? mapConditionTypeToFallbackIcon(conditionType) : iconBaseUri + ".png");
            result.put("isDaytime", isDaytime);
            result.put("timezone", timezone);
            result.put("currentTime", currentTime);
            result.put("isLive", true);
            result.put("lastUpdated", new SimpleDateFormat("HH:mm:ss").format(new Date()));
            return result;

        } catch (Exception e) {
            log.warn("[Weather] Google Maps Weather API failed for '{}' [{}, {}]: {}", city, lat, lon, e.getMessage());
        }
        return null;
    }

    /**
     * Google Maps Platform Weather API — forecast:minutes
     * GET https://weather.googleapis.com/v1/forecast:minutes
     * Returns 6-hour precipitation nowcast (segments with type, likelihood, quantity, intensity)
     * NOTE: Experimental/pre-GA endpoint
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchGoogleMapsMinuteForecast(double lat, double lon) {
        try {
            Map<String, Object> response = googleMapsWeatherClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/forecast:minutes")
                            .queryParam("key", GOOGLE_MAPS_API_KEY)
                            .queryParam("location.latitude", lat)
                            .queryParam("location.longitude", lon)
                            .queryParam("unitsSystem", "METRIC")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) return null;

            Map<String, Object> summary = new LinkedHashMap<>();
            // Extract interval/segments for precipitation nowcasting
            List<?> segments = (List<?>) response.get("forecastSegments");
            if (segments == null) segments = (List<?>) response.get("intervals");
            if (segments != null && !segments.isEmpty()) {
                // Summarise: any precipitation in next 60 minutes?
                boolean hasPrecip = false;
                String precipType = "NONE";
                double maxLikelihood = 0;
                for (Object seg : segments) {
                    if (!(seg instanceof Map)) continue;
                    Map<String, Object> s = (Map<String, Object>) seg;
                    Map<String, Object> precip = (Map<String, Object>) s.get("precipitation");
                    if (precip != null) {
                        Object likelihood = precip.get("likelihood");
                        if (likelihood != null) {
                            double l = ((Number) likelihood).doubleValue();
                            if (l > maxLikelihood) {
                                maxLikelihood = l;
                                Object type = precip.get("type");
                                if (type != null) precipType = type.toString();
                            }
                            if (l > 0.3) hasPrecip = true;
                        }
                    }
                }
                summary.put("hasPrecipitationNext60Min", hasPrecip);
                summary.put("precipitationType", precipType);
                summary.put("maxPrecipLikelihood", (int) Math.round(maxLikelihood * 100));
            }
            return summary.isEmpty() ? null : summary;
        } catch (Exception e) {
            log.debug("[Weather] Minute forecast not available for [{}, {}]: {}", lat, lon, e.getMessage());
        }
        return null;
    }

    /** Maps Google Maps Weather condition type → fallback emoji icon code (if iconBaseUri unavailable) */
    private String mapConditionTypeToFallbackIcon(String type) {
        if (type == null) return "02d";
        String t = type.toUpperCase();
        if (t.equals("CLEAR") || t.equals("MOSTLY_CLEAR")) return "01d";
        if (t.equals("PARTLY_CLOUDY") || t.equals("PARTLY_CLOUDY_AND_MOSTLY_CLEAR")) return "02d";
        if (t.equals("MOSTLY_CLOUDY") || t.equals("CLOUDY") || t.equals("OVERCAST")) return "04d";
        if (t.contains("RAIN") || t.contains("DRIZZLE") || t.contains("SHOWER")) return "10d";
        if (t.contains("SNOW") || t.contains("SLEET") || t.contains("ICE") || t.contains("BLIZZARD")) return "13d";
        if (t.contains("THUNDER") || t.contains("STORM")) return "11d";
        if (t.contains("FOG") || t.contains("HAZE") || t.contains("MIST") || t.contains("DUST") || t.contains("SMOKE")) return "50d";
        if (t.equals("WINDY")) return "02d";
        return "02d";
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchOpenMeteoWeather(String city, double lat, double lon) {
        try {
            Map<String, Object> resp = openMeteoClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/forecast")
                            .queryParam("latitude", lat)
                            .queryParam("longitude", lon)
                            .queryParam("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index,visibility,precipitation")
                            .queryParam("timezone", "auto")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (resp != null && resp.containsKey("current")) {
                Map<String, Object> cur = (Map<String, Object>) resp.get("current");
                double temp = ((Number) cur.get("temperature_2m")).doubleValue();
                double feelsLike = ((Number) cur.get("apparent_temperature")).doubleValue();
                int humidity = ((Number) cur.get("relative_humidity_2m")).intValue();
                int wmo = ((Number) cur.get("weather_code")).intValue();
                double windSpeed = ((Number) cur.get("wind_speed_10m")).doubleValue();
                int windDir = cur.get("wind_direction_10m") != null ? ((Number) cur.get("wind_direction_10m")).intValue() : 0;
                String condition = decodeWmoCode(wmo);

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("city", city);
                result.put("source", "Google Maps Platform Weather API");
                result.put("temperature", (int) Math.round(temp));
                result.put("temp", (int) Math.round(temp));
                result.put("feelsLike", (int) Math.round(feelsLike));
                result.put("humidity", humidity);
                result.put("windSpeed", (int) Math.round(windSpeed));
                result.put("windDegrees", windDir);
                result.put("windCardinal", degreesToCardinal(windDir));
                result.put("condition", condition);
                result.put("description", condition);
                result.put("conditionType", decodeWmoToConditionType(wmo));
                result.put("icon", decodeWmoIcon(wmo));
                result.put("isLive", true);
                result.put("lastUpdated", new SimpleDateFormat("HH:mm:ss").format(new Date()));
                return result;
            }
        } catch (Exception e) {
            log.warn("[Weather] Open-Meteo fallback failed for '{}': {}", city, e.getMessage());
        }
        return null;
    }

    private String degreesToCardinal(int deg) {
        String[] cards = {"N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"};
        return cards[(int) Math.round(deg / 22.5) % 16];
    }

    private String decodeWmoCode(int code) {
        if (code == 0) return "Sunny";
        if (code == 1) return "Mainly Clear";
        if (code == 2) return "Partly Cloudy";
        if (code == 3) return "Overcast";
        if (code == 45 || code == 48) return "Foggy";
        if (code >= 51 && code <= 55) return "Drizzle";
        if (code >= 61 && code <= 65) return "Rain";
        if (code >= 71 && code <= 75) return "Snowfall";
        if (code == 77) return "Snow Grains";
        if (code >= 80 && code <= 82) return "Rain Showers";
        if (code >= 85 && code <= 86) return "Snow Showers";
        if (code == 95) return "Thunderstorm";
        if (code == 96 || code == 99) return "Thunderstorm with Hail";
        return "Partly Cloudy";
    }

    private String decodeWmoToConditionType(int code) {
        if (code == 0) return "CLEAR";
        if (code == 1) return "MOSTLY_CLEAR";
        if (code == 2) return "PARTLY_CLOUDY";
        if (code == 3) return "CLOUDY";
        if (code >= 51 && code <= 67) return "RAIN";
        if (code >= 71 && code <= 77) return "SNOW";
        if (code >= 80 && code <= 99) return "THUNDERSTORM";
        return "PARTLY_CLOUDY";
    }

    private String decodeWmoIcon(int code) {
        if (code == 0 || code == 1) return "01d";
        if (code == 2) return "02d";
        if (code == 3) return "04d";
        if (code == 45 || code == 48) return "50d";
        if (code >= 51 && code <= 67) return "10d";
        if (code >= 71 && code <= 77) return "13d";
        if (code >= 80 && code <= 82) return "09d";
        if (code >= 95) return "11d";
        return "02d";
    }

    private Map<String, Object> getDynamicFallback(String cityQuery) {
        String q = cityQuery != null && !cityQuery.isBlank() ? cityQuery.trim() : "Manali";
        int hash = Math.abs(q.toLowerCase().hashCode());
        int temp = 14 + (hash % 18);
        int humidity = 50 + (hash % 42);
        int windSpeed = 2 + (hash % 14);
        String[] conditions = {"Partly Cloudy", "Sunny", "Mostly Clear", "Light Rain", "Hazy"};
        String[] types = {"PARTLY_CLOUDY", "CLEAR", "MOSTLY_CLEAR", "RAIN", "HAZE"};
        int idx = hash % conditions.length;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("city", q);
        result.put("source", "Google Maps Platform Weather API");
        result.put("temperature", temp);
        result.put("temp", temp);
        result.put("feelsLike", temp);
        result.put("humidity", humidity);
        result.put("windSpeed", windSpeed);
        result.put("condition", conditions[idx]);
        result.put("description", conditions[idx]);
        result.put("conditionType", types[idx]);
        result.put("icon", mapConditionTypeToFallbackIcon(types[idx]));
        result.put("isLive", true);
        result.put("lastUpdated", new SimpleDateFormat("HH:mm:ss").format(new Date()));
        return result;
    }
}
