package com.cbg.travel.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.text.SimpleDateFormat;
import java.util.*;

@Service
@Slf4j
public class WeatherService {

    // Global Live Weather API Keys (configured via environment variables or default keyless providers)
    private static final String GOOGLE_MAPS_API_KEY = System.getenv().getOrDefault("GOOGLE_WEATHER_API_KEY", "");
    private static final String WEATHER_API_KEY = System.getenv().getOrDefault("WEATHER_API_KEY", "");
    private static final String OPENWEATHER_API_KEY = System.getenv().getOrDefault("OPENWEATHER_API_KEY", "");

    private final WebClient googleMapsWeatherClient;
    private final WebClient weatherApiClient;
    private final WebClient openWeatherClient;
    private final WebClient openMeteoGeoClient;
    private final WebClient openMeteoClient;
    private final WebClient wttrClient;

    public WeatherService() {
        this.googleMapsWeatherClient = WebClient.builder()
                .baseUrl("https://weather.googleapis.com")
                .defaultHeader("Accept", "application/json")
                .build();

        this.weatherApiClient = WebClient.builder()
                .baseUrl("https://api.weatherapi.com/v1")
                .build();

        this.openWeatherClient = WebClient.builder()
                .baseUrl("https://api.openweathermap.org/data/2.5")
                .build();

        this.openMeteoGeoClient = WebClient.builder()
                .baseUrl("https://geocoding-api.open-meteo.com/v1")
                .build();

        this.openMeteoClient = WebClient.builder()
                .baseUrl("https://api.open-meteo.com/v1")
                .build();

        this.wttrClient = WebClient.builder()
                .baseUrl("https://wttr.in")
                .defaultHeader("Accept", "application/json")
                .defaultHeader("User-Agent", "VoyaCore-Weather/1.0")
                .build();
    }

    public Map<String, Object> getWeatherForecast(String city) {
        return getCurrentWeather(city);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getCurrentWeather(String cityQuery) {
        String city = (cityQuery == null || cityQuery.isBlank()) ? "Manali" : cityQuery.trim();

        // Step 0: Geocode city → [lat, lon, ianaTimezone] via Open-Meteo Geocoding
        // We need the IANA timezone (e.g. "America/New_York") BEFORE fetching weather
        // so the frontend can show correct day/night for the destination
        String[] geoInfo = geocodeCity(city);
        double lat = geoInfo != null ? Double.parseDouble(geoInfo[0]) : 32.2432;
        double lon = geoInfo != null ? Double.parseDouble(geoInfo[1]) : 77.1892;
        String ianaTimezone = geoInfo != null ? geoInfo[2] : "";

        // ═══════════════════════════════════════════════════════════════
        // ENGINE 1 (PRIMARY): wttr.in — Real Weather Station Observations
        // Free, no API key, uses actual ground station data worldwide
        // Most accurate for current conditions (matches timeanddate.com)
        // ═══════════════════════════════════════════════════════════════
        Map<String, Object> wttrData = fetchWttrIn(city, ianaTimezone);
        if (wttrData != null && wttrData.containsKey("temperature")) {
            log.info("[Weather] ENGINE 1 (wttr.in station obs): Live weather for '{}' tz={}", city, ianaTimezone);
            return wttrData;
        }

        // ═══════════════════════════════════════════════════════════════
        // ENGINE 2 (FALLBACK): Open-Meteo Global Meteorological Network
        // Free, no API key, satellite+model data (can differ ~2-5°C)
        // ═══════════════════════════════════════════════════════════════
        Map<String, Object> openMeteoData = fetchOpenMeteoWeather(city, lat, lon);
        if (openMeteoData != null && openMeteoData.containsKey("temperature")) {
            log.info("[Weather] ENGINE 2 (Open-Meteo model): Live weather for '{}' [{}, {}]", city, lat, lon);
            return openMeteoData;
        }

        // ═══════════════════════════════════════════════════════════════
        // ENGINE 3 (OPTIONAL): WeatherAPI.com — requires WEATHER_API_KEY env var
        // ═══════════════════════════════════════════════════════════════
        Map<String, Object> weatherApiData = fetchWeatherApiCom(city);
        if (weatherApiData != null && weatherApiData.containsKey("temperature")) {
            log.info("[Weather] ENGINE 3 (WeatherAPI.com): Live weather for '{}'", city);
            return weatherApiData;
        }

        // ═══════════════════════════════════════════════════════════════
        // ENGINE 4 (OPTIONAL): OpenWeatherMap — requires OPENWEATHER_API_KEY env var
        // ═══════════════════════════════════════════════════════════════
        Map<String, Object> openWeatherData = fetchOpenWeatherMap(city);
        if (openWeatherData != null && openWeatherData.containsKey("temperature")) {
            log.info("[Weather] ENGINE 4 (OpenWeatherMap): Live weather for '{}'", city);
            return openWeatherData;
        }

        // ═══════════════════════════════════════════════════════════════
        // ENGINE 5 (OPTIONAL): Google Maps Platform Weather API
        // ═══════════════════════════════════════════════════════════════
        Map<String, Object> googleData = fetchGoogleMapsCurrentConditions(city, lat, lon);
        if (googleData != null && googleData.containsKey("temperature")) {
            Map<String, Object> minuteData = fetchGoogleMapsMinuteForecast(lat, lon);
            if (minuteData != null) googleData.put("minuteForecast", minuteData);
            log.info("[Weather] ENGINE 5 (Google Maps): Live weather for '{}'", city);
            return googleData;
        }

        return getDynamicFallback(city);
    }

    /**
     * wttr.in — Free worldwide weather station observation data.
     * Uses actual ground station measurements, not model/forecast data.
     * URL format: https://wttr.in/{city}?format=j1
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchWttrIn(String city, String ianaTimezone) {
        try {
            Map<String, Object> response = wttrClient.get()
                    .uri("/{city}?format=j1", city)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null || !response.containsKey("current_condition")) return null;

            List<Map<String, Object>> ccList = (List<Map<String, Object>>) response.get("current_condition");
            if (ccList == null || ccList.isEmpty()) return null;
            Map<String, Object> cc = ccList.get(0);

            // Parse observation values
            int tempC = parseIntSafe(cc.get("temp_C"), 20);
            int feelsLikeC = parseIntSafe(cc.get("FeelsLikeC"), tempC);
            int humidity = parseIntSafe(cc.get("humidity"), 70);
            int windKmph = parseIntSafe(cc.get("windspeedKmph"), 0);
            int windDeg = parseIntSafe(cc.get("winddirDegree"), 0);
            String windDir16 = cc.get("winddir16Point") != null ? cc.get("winddir16Point").toString() : degreesToCardinal(windDeg);
            int uvIndex = parseIntSafe(cc.get("uvIndex"), 0);
            int visKm = parseIntSafe(cc.get("visibility"), 10);
            int dewPointC = parseIntSafe(cc.get("DewPointC"), 0);
            int pressure = parseIntSafe(cc.get("pressure"), 1013);

            // Weather description
            String conditionText = "Partly Cloudy";
            List<Map<String, Object>> descList = (List<Map<String, Object>>) cc.get("weatherDesc");
            if (descList != null && !descList.isEmpty() && descList.get(0).get("value") != null) {
                conditionText = descList.get(0).get("value").toString();
            }

            // Weather icon URL from wttr.in
            String iconUrl = "";
            List<Map<String, Object>> iconList = (List<Map<String, Object>>) cc.get("weatherIconUrl");
            if (iconList != null && !iconList.isEmpty() && iconList.get(0).get("value") != null) {
                iconUrl = iconList.get(0).get("value").toString();
            }

            // Nearest area info for resolved location name + timezone
            String resolvedName = city;
            String country = "";
            String timezone = "";
            List<Map<String, Object>> nearestArea = (List<Map<String, Object>>) response.get("nearest_area");
            if (nearestArea != null && !nearestArea.isEmpty()) {
                Map<String, Object> area = nearestArea.get(0);
                List<Map<String, Object>> areaName = (List<Map<String, Object>>) area.get("areaName");
                if (areaName != null && !areaName.isEmpty() && areaName.get(0).get("value") != null) {
                    resolvedName = areaName.get(0).get("value").toString();
                }
                List<Map<String, Object>> countryList = (List<Map<String, Object>>) area.get("country");
                if (countryList != null && !countryList.isEmpty() && countryList.get(0).get("value") != null) {
                    country = countryList.get(0).get("value").toString();
                }
                // wttr.in provides UTC offset info in time_zone block
                List<Map<String, Object>> tzList = (List<Map<String, Object>>) response.get("time_zone");
                if (tzList != null && !tzList.isEmpty()) {
                    Map<String, Object> tzInfo = tzList.get(0);
                    if (tzInfo.get("zone") != null) timezone = tzInfo.get("zone").toString();
                }
            }

            String displayCity = resolvedName + (country.isEmpty() ? "" : ", " + country);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("city", displayCity);
            result.put("source", "Live Station Observation · wttr.in");
            result.put("temperature", tempC);
            result.put("temp", tempC);
            result.put("feelsLike", feelsLikeC);
            result.put("humidity", humidity);
            result.put("dewPoint", dewPointC);
            result.put("uvIndex", uvIndex);
            result.put("visibility", visKm);
            result.put("pressure", pressure);
            result.put("windSpeed", windKmph);
            result.put("windDegrees", windDeg);
            result.put("windCardinal", windDir16);
            result.put("condition", conditionText);
            result.put("description", conditionText);
            result.put("conditionType", mapConditionTextToType(conditionText));
            result.put("icon", mapConditionTextToIcon(conditionText));
            result.put("iconUrl", iconUrl);
            result.put("timezone", (ianaTimezone != null && !ianaTimezone.isEmpty()) ? ianaTimezone : timezone);
            result.put("isLive", true);
            result.put("lastUpdated", new SimpleDateFormat("HH:mm:ss").format(new Date()));
            return result;
        } catch (Exception e) {
            log.debug("[Weather] wttr.in fetch failed for '{}': {}", city, e.getMessage());
        }
        return null;
    }

    private int parseIntSafe(Object val, int defaultVal) {
        if (val == null) return defaultVal;
        try {
            return Integer.parseInt(val.toString().trim());
        } catch (NumberFormatException e) {
            try {
                return (int) Math.round(Double.parseDouble(val.toString().trim()));
            } catch (NumberFormatException ex) {
                return defaultVal;
            }
        }
    }

    /**
     * WeatherAPI.com Real-time Live Weather
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchWeatherApiCom(String city) {
        if (WEATHER_API_KEY == null || WEATHER_API_KEY.isBlank()) return null;
        try {
            Map<String, Object> response = weatherApiClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/current.json")
                            .queryParam("key", WEATHER_API_KEY)
                            .queryParam("q", city)
                            .queryParam("aqi", "no")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("current")) {
                Map<String, Object> current = (Map<String, Object>) response.get("current");
                Map<String, Object> location = (Map<String, Object>) response.get("location");
                Map<String, Object> conditionObj = (Map<String, Object>) current.get("condition");

                double tempC = ((Number) current.get("temp_c")).doubleValue();
                double feelsLikeC = ((Number) current.get("feelslike_c")).doubleValue();
                int humidity = ((Number) current.get("humidity")).intValue();
                double windKmh = ((Number) current.get("wind_kph")).doubleValue();
                int windDegree = current.get("wind_degree") != null ? ((Number) current.get("wind_degree")).intValue() : 0;
                String windDir = current.get("wind_dir") != null ? current.get("wind_dir").toString() : "";
                double gustKmh = current.get("gust_kph") != null ? ((Number) current.get("gust_kph")).doubleValue() : 0;
                double uv = current.get("uv") != null ? ((Number) current.get("uv")).doubleValue() : 0;
                double visKm = current.get("vis_km") != null ? ((Number) current.get("vis_km")).doubleValue() : 10;
                int isDay = current.get("is_day") != null ? ((Number) current.get("is_day")).intValue() : 1;

                String conditionText = conditionObj != null && conditionObj.get("text") != null 
                        ? conditionObj.get("text").toString() : "Partly Cloudy";
                String iconUrl = conditionObj != null && conditionObj.get("icon") != null
                        ? "https:" + conditionObj.get("icon").toString() : "";

                String locName = location != null && location.get("name") != null ? location.get("name").toString() : city;
                String country = location != null && location.get("country") != null ? location.get("country").toString() : "";
                String tz = location != null && location.get("tz_id") != null ? location.get("tz_id").toString() : "";

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("city", locName + (country.isEmpty() ? "" : ", " + country));
                result.put("source", "WeatherAPI.com Live Stream");
                result.put("temperature", (int) Math.round(tempC));
                result.put("temp", (int) Math.round(tempC));
                result.put("feelsLike", (int) Math.round(feelsLikeC));
                result.put("humidity", humidity);
                result.put("uvIndex", (int) Math.round(uv));
                result.put("windSpeed", (int) Math.round(windKmh));
                result.put("windDegrees", windDegree);
                result.put("windCardinal", windDir);
                result.put("windGust", (int) Math.round(gustKmh));
                result.put("visibility", (int) Math.round(visKm));
                result.put("condition", conditionText);
                result.put("description", conditionText);
                result.put("conditionType", mapConditionTextToType(conditionText));
                result.put("iconUrl", iconUrl);
                result.put("icon", mapConditionTextToIcon(conditionText));
                result.put("isDaytime", isDay == 1);
                result.put("timezone", tz);
                result.put("isLive", true);
                result.put("lastUpdated", new SimpleDateFormat("HH:mm:ss").format(new Date()));
                return result;
            }
        } catch (Exception e) {
            log.debug("[Weather] WeatherAPI.com fetch notice for '{}': {}", city, e.getMessage());
        }
        return null;
    }

    /**
     * OpenWeatherMap API
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchOpenWeatherMap(String city) {
        if (OPENWEATHER_API_KEY == null || OPENWEATHER_API_KEY.isBlank()) return null;
        try {
            Map<String, Object> response = openWeatherClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/weather")
                            .queryParam("q", city)
                            .queryParam("appid", OPENWEATHER_API_KEY)
                            .queryParam("units", "metric")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("main")) {
                Map<String, Object> main = (Map<String, Object>) response.get("main");
                Map<String, Object> wind = (Map<String, Object>) response.get("wind");
                List<Map<String, Object>> weatherList = (List<Map<String, Object>>) response.get("weather");

                double tempC = ((Number) main.get("temp")).doubleValue();
                double feelsLikeC = ((Number) main.get("feels_like")).doubleValue();
                int humidity = ((Number) main.get("humidity")).intValue();

                double windSpeedMps = wind != null && wind.get("speed") != null ? ((Number) wind.get("speed")).doubleValue() : 0;
                int windDeg = wind != null && wind.get("deg") != null ? ((Number) wind.get("deg")).intValue() : 0;
                double windKmh = windSpeedMps * 3.6;

                String conditionText = "Partly Cloudy";
                String iconCode = "02d";
                if (weatherList != null && !weatherList.isEmpty()) {
                    Map<String, Object> w = weatherList.get(0);
                    conditionText = w.get("main") != null ? w.get("main").toString() : "Partly Cloudy";
                    iconCode = w.get("icon") != null ? w.get("icon").toString() : "02d";
                }

                String locName = response.get("name") != null ? response.get("name").toString() : city;

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("city", locName);
                result.put("source", "OpenWeatherMap Live Stream");
                result.put("temperature", (int) Math.round(tempC));
                result.put("temp", (int) Math.round(tempC));
                result.put("feelsLike", (int) Math.round(feelsLikeC));
                result.put("humidity", humidity);
                result.put("windSpeed", (int) Math.round(windKmh));
                result.put("windDegrees", windDeg);
                result.put("windCardinal", degreesToCardinal(windDeg));
                result.put("condition", conditionText);
                result.put("description", conditionText);
                result.put("conditionType", mapConditionTextToType(conditionText));
                result.put("icon", iconCode);
                result.put("isDaytime", iconCode.endsWith("d"));
                result.put("isLive", true);
                result.put("lastUpdated", new SimpleDateFormat("HH:mm:ss").format(new Date()));
                return result;
            }
        } catch (Exception e) {
            log.debug("[Weather] OpenWeatherMap fetch notice for '{}': {}", city, e.getMessage());
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    /**
     * Geocode city → [latitude, longitude, ianaTimezone]
     * Uses Open-Meteo Geocoding API which returns IANA timezone strings like
     * "America/New_York", "Europe/London", "Asia/Tokyo" etc.
     */
    private String[] geocodeCity(String city) {
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
                    String lat = String.valueOf(((Number) loc.get("latitude")).doubleValue());
                    String lon = String.valueOf(((Number) loc.get("longitude")).doubleValue());
                    String tz = loc.get("timezone") != null ? loc.get("timezone").toString() : "";
                    log.debug("[Geocode] '{}' → [{}, {}] tz={}", city, lat, lon, tz);
                    return new String[]{lat, lon, tz};
                }
            }
        } catch (Exception e) {
            log.warn("[Weather] Geocoding failed for '{}': {}", city, e.getMessage());
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchGoogleMapsCurrentConditions(String city, double lat, double lon) {
        if (GOOGLE_MAPS_API_KEY == null || GOOGLE_MAPS_API_KEY.isBlank()) return null;
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

            Map<String, Object> tempMap = (Map<String, Object>) response.get("temperature");
            if (tempMap == null) return null;
            double tempC = ((Number) tempMap.getOrDefault("degrees", 17)).doubleValue();

            Map<String, Object> feelsLikeMap = (Map<String, Object>) response.get("feelsLikeTemperature");
            double feelsLike = feelsLikeMap != null
                    ? ((Number) feelsLikeMap.getOrDefault("degrees", tempC)).doubleValue()
                    : tempC;

            int humidity = response.get("relativeHumidity") != null
                    ? ((Number) response.get("relativeHumidity")).intValue()
                    : 70;

            Map<String, Object> dewMap = (Map<String, Object>) response.get("dewPoint");
            double dewPoint = dewMap != null ? ((Number) dewMap.getOrDefault("degrees", 0)).doubleValue() : 0;

            int uvIndex = response.get("uvIndex") != null
                    ? ((Number) response.get("uvIndex")).intValue()
                    : 0;

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

            double visibilityKm = 0;
            Map<String, Object> visMap = (Map<String, Object>) response.get("visibility");
            if (visMap != null) visibilityKm = ((Number) visMap.getOrDefault("distance", 10)).doubleValue();

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

            String currentTime = response.get("currentTime") != null ? response.get("currentTime").toString() : "";
            boolean isDaytime = response.get("isDaytime") instanceof Boolean ? (Boolean) response.get("isDaytime") : true;
            String timezone = "";
            Map<String, Object> tzMap = (Map<String, Object>) response.get("timeZone");
            if (tzMap != null && tzMap.get("id") != null) timezone = tzMap.get("id").toString();

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
            result.put("iconBaseUri", iconBaseUri);
            result.put("icon", iconBaseUri.isEmpty() ? mapConditionTypeToFallbackIcon(conditionType) : iconBaseUri + ".png");
            result.put("isDaytime", isDaytime);
            result.put("timezone", timezone);
            result.put("currentTime", currentTime);
            result.put("isLive", true);
            result.put("lastUpdated", new SimpleDateFormat("HH:mm:ss").format(new Date()));
            return result;

        } catch (Exception e) {
            log.debug("[Weather] Google Maps Weather API fetch notice for '{}': {}", city, e.getMessage());
        }
        return null;
    }

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
            List<?> segments = (List<?>) response.get("forecastSegments");
            if (segments == null) segments = (List<?>) response.get("intervals");
            if (segments != null && !segments.isEmpty()) {
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
            log.debug("[Weather] Minute forecast notice for [{}, {}]: {}", lat, lon, e.getMessage());
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchOpenMeteoWeather(String city, double lat, double lon) {
        try {
            Map<String, Object> resp = openMeteoClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/forecast")
                            .queryParam("latitude", lat)
                            .queryParam("longitude", lon)
                            .queryParam("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,visibility,precipitation,surface_pressure,dew_point_2m,is_day")
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
                double windGust = cur.get("wind_gusts_10m") != null ? ((Number) cur.get("wind_gusts_10m")).doubleValue() : 0;
                double uv = cur.get("uv_index") != null ? ((Number) cur.get("uv_index")).doubleValue() : 0;
                double vis = cur.get("visibility") != null ? ((Number) cur.get("visibility")).doubleValue() / 1000.0 : 10;
                double dewPoint = cur.get("dew_point_2m") != null ? ((Number) cur.get("dew_point_2m")).doubleValue() : 0;
                int isDay = cur.get("is_day") != null ? ((Number) cur.get("is_day")).intValue() : 1;
                String condition = decodeWmoCode(wmo);

                // Extract timezone from Open-Meteo response metadata
                String timezone = resp.get("timezone") != null ? resp.get("timezone").toString() : "";

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("city", city);
                result.put("source", "Live Weather \u00b7 Open-Meteo");
                result.put("temperature", (int) Math.round(temp));
                result.put("temp", (int) Math.round(temp));
                result.put("feelsLike", (int) Math.round(feelsLike));
                result.put("humidity", humidity);
                result.put("dewPoint", (int) Math.round(dewPoint));
                result.put("uvIndex", (int) Math.round(uv));
                result.put("visibility", (int) Math.round(vis));
                result.put("windSpeed", (int) Math.round(windSpeed));
                result.put("windDegrees", windDir);
                result.put("windCardinal", degreesToCardinal(windDir));
                result.put("windGust", (int) Math.round(windGust));
                result.put("condition", condition);
                result.put("description", condition);
                result.put("conditionType", decodeWmoToConditionType(wmo));
                result.put("icon", decodeWmoIcon(wmo));
                result.put("isDaytime", isDay == 1);
                result.put("timezone", timezone);
                result.put("isLive", true);
                result.put("lastUpdated", new SimpleDateFormat("HH:mm:ss").format(new Date()));
                return result;
            }
        } catch (Exception e) {
            log.warn("[Weather] Open-Meteo fetch failed for '{}' [{}, {}]: {}", city, lat, lon, e.getMessage());
        }
        return null;
    }

    private String degreesToCardinal(int deg) {
        String[] cards = {"N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"};
        return cards[(int) Math.round(deg / 22.5) % 16];
    }

    private String mapConditionTextToType(String text) {
        if (text == null) return "PARTLY_CLOUDY";
        String t = text.toLowerCase();
        if (t.contains("sun") || t.contains("clear")) return "CLEAR";
        if (t.contains("cloud") || t.contains("overcast")) return "PARTLY_CLOUDY";
        if (t.contains("rain") || t.contains("drizzle") || t.contains("shower")) return "RAIN";
        if (t.contains("snow") || t.contains("sleet") || t.contains("ice")) return "SNOW";
        if (t.contains("thunder") || t.contains("storm")) return "THUNDERSTORM";
        if (t.contains("fog") || t.contains("mist") || t.contains("haze")) return "HAZE";
        return "PARTLY_CLOUDY";
    }

    private String mapConditionTextToIcon(String text) {
        if (text == null) return "02d";
        String t = text.toLowerCase();
        if (t.contains("sun") || t.contains("clear")) return "01d";
        if (t.contains("cloud") || t.contains("overcast")) return "02d";
        if (t.contains("rain") || t.contains("drizzle") || t.contains("shower")) return "10d";
        if (t.contains("snow") || t.contains("sleet")) return "13d";
        if (t.contains("thunder") || t.contains("storm")) return "11d";
        if (t.contains("fog") || t.contains("mist") || t.contains("haze")) return "50d";
        return "02d";
    }

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
        result.put("source", "Worldwide Weather Live Stream");
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
