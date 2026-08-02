package com.cbg.travel.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.text.SimpleDateFormat;
import java.util.*;

@Service
@Slf4j
public class WeatherService {

    private final WebClient webClient;

    @Value("${app.openweathermap.api-key:}")
    private String apiKey;

    public WeatherService() {
        this.webClient = WebClient.builder()
                .baseUrl("https://api.openweathermap.org/data/2.5")
                .build();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getWeatherForecast(String city) {
        return getCurrentWeather(city);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getCurrentWeather(String cityQuery) {
        String city = (cityQuery == null || cityQuery.isBlank()) ? "Switzerland" : cityQuery.trim();

        // 1. Primary: Server-Side Open-Meteo Real-Time Global Satellite Radar Endpoint
        try {
            WebClient openMeteoGeoClient = WebClient.builder()
                    .baseUrl("https://geocoding-api.open-meteo.com/v1")
                    .build();

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
                    Map<String, Object> location = results.get(0);
                    Double lat = ((Number) location.get("latitude")).doubleValue();
                    Double lon = ((Number) location.get("longitude")).doubleValue();
                    String resolvedName = (String) location.get("name");
                    String country = (String) location.get("country");

                    WebClient openMeteoClient = WebClient.builder()
                            .baseUrl("https://api.open-meteo.com/v1")
                            .build();

                    Map<String, Object> weatherResponse = openMeteoClient.get()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/forecast")
                                    .queryParam("latitude", lat)
                                    .queryParam("longitude", lon)
                                    .queryParam("current", "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m")
                                    .queryParam("timezone", "auto")
                                    .build())
                            .retrieve()
                            .bodyToMono(Map.class)
                            .block();

                    if (weatherResponse != null && weatherResponse.containsKey("current")) {
                        Map<String, Object> current = (Map<String, Object>) weatherResponse.get("current");
                        double temp = ((Number) current.get("temperature_2m")).doubleValue();
                        double feelsLike = ((Number) current.get("apparent_temperature")).doubleValue();
                        int humidity = ((Number) current.get("relative_humidity_2m")).intValue();
                        int weatherCode = ((Number) current.get("weather_code")).intValue();
                        double windSpeed = ((Number) current.get("wind_speed_10m")).doubleValue();

                        String condition = decodeWmoCode(weatherCode);

                        Map<String, Object> result = new LinkedHashMap<>();
                        result.put("city", resolvedName != null ? resolvedName : city);
                        result.put("country", country != null ? country : "");
                        result.put("source", "Open-Meteo Global Satellite Radar");
                        result.put("temperature", (int) Math.round(temp));
                        result.put("temp", (int) Math.round(temp));
                        result.put("feelsLike", (int) Math.round(feelsLike));
                        result.put("humidity", humidity);
                        result.put("windSpeed", (int) Math.round(windSpeed));
                        result.put("condition", condition);
                        result.put("description", condition + ", " + (int) Math.round(temp) + "°C");
                        result.put("icon", decodeWmoIcon(weatherCode));
                        result.put("isLive", true);
                        result.put("lastUpdated", new SimpleDateFormat("HH:mm:ss").format(new Date()));
                        return result;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Open-Meteo satellite fetch failed for '{}': {}", city, e.getMessage());
        }

        // 2. OpenWeatherMap API Key (if provided)
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                Map<String, Object> response = webClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/weather")
                                .queryParam("q", city)
                                .queryParam("appid", apiKey)
                                .queryParam("units", "metric")
                                .build())
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();

                if (response != null) {
                    return response;
                }
            } catch (Exception e) {
                log.warn("OpenWeatherMap fetch failed for '{}': {}", city, e.getMessage());
            }
        }

        // 3. Simulated Climate Database Fallback
        return getSimulatedWeather(city);
    }

    private String decodeWmoCode(int code) {
        switch (code) {
            case 0: return "Clear & Sunny";
            case 1: return "Mainly Clear";
            case 2: return "Partly Cloudy";
            case 3: return "Overcast";
            case 45: case 48: return "Fog & Haze";
            case 51: case 53: case 55: return "Drizzle Showers";
            case 61: case 63: case 65: return "Rain Showers";
            case 71: case 73: case 75: return "Snowfall";
            case 80: case 81: case 82: return "Heavy Showers";
            case 95: case 96: case 99: return "Thunderstorm";
            default: return "Partly Cloudy";
        }
    }

    private String decodeWmoIcon(int code) {
        switch (code) {
            case 0: case 1: return "01d";
            case 2: return "02d";
            case 3: return "04d";
            case 51: case 53: case 55: case 61: case 63: case 65: case 80: case 81: case 82: return "10d";
            case 71: case 73: case 75: case 85: case 86: return "13d";
            case 95: case 96: case 99: return "11d";
            default: return "02d";
        }
    }

    private Map<String, Object> getSimulatedWeather(String city) {
        Random rand = new Random(city.hashCode());
        int temp = 16 + rand.nextInt(18);
        int humidity = 45 + rand.nextInt(35);
        String[] conditions = {"Clear & Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Breezy"};
        String condition = conditions[Math.abs(city.hashCode()) % conditions.length];

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("city", city);
        result.put("source", "Simulated Climate Profile");
        result.put("temperature", temp);
        result.put("temp", temp);
        result.put("feelsLike", temp + 1);
        result.put("humidity", humidity);
        result.put("windSpeed", 12);
        result.put("condition", condition);
        result.put("description", condition + ", " + temp + "°C");
        result.put("icon", "01d");
        result.put("isLive", false);
        result.put("lastUpdated", new SimpleDateFormat("HH:mm:ss").format(new Date()));
        return result;
    }
}
