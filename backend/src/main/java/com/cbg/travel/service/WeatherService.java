package com.cbg.travel.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

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
        if (apiKey == null || apiKey.isBlank()) {
            log.info("OpenWeatherMap API key not configured. Returning simulated weather for '{}'", city);
            return getSimulatedWeather(city);
        }

        try {
            Map<String, Object> response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/forecast")
                            .queryParam("q", city)
                            .queryParam("appid", apiKey)
                            .queryParam("units", "metric")
                            .queryParam("cnt", 5)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null) {
                return response;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch weather for '{}': {}. Using simulated data.", city, e.getMessage());
        }

        return getSimulatedWeather(city);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getCurrentWeather(String city) {
        if (apiKey == null || apiKey.isBlank()) {
            return getSimulatedWeather(city);
        }

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
            log.warn("Failed to fetch current weather for '{}': {}", city, e.getMessage());
        }

        return getSimulatedWeather(city);
    }

    private Map<String, Object> getSimulatedWeather(String city) {
        Random rand = new Random(city.hashCode());
        int temp = 15 + rand.nextInt(25); // 15-40°C range
        int humidity = 30 + rand.nextInt(50);
        String[] conditions = {"Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Sunny"};
        String condition = conditions[Math.abs(city.hashCode()) % conditions.length];

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("city", city);
        result.put("source", "simulated");
        result.put("temperature", temp);
        result.put("humidity", humidity);
        result.put("condition", condition);
        result.put("description", condition + ", " + temp + "°C");
        result.put("advisory", temp > 35 ? "Heat advisory: stay hydrated and avoid prolonged outdoor exposure." :
                temp < 5 ? "Cold weather advisory: pack warm clothing." :
                        "Weather conditions are favorable for travel.");
        return result;
    }
}
