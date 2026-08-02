package com.cbg.travel.controller;

import com.cbg.travel.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping("/forecast")
    public ResponseEntity<Map<String, Object>> getForecast(@RequestParam String city) {
        return ResponseEntity.ok(weatherService.getWeatherForecast(city));
    }

    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrent(@RequestParam String city) {
        return ResponseEntity.ok(weatherService.getCurrentWeather(city));
    }
}
