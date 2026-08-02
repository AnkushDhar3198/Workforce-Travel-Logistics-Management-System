package com.cbg.travel.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class CurrencyService {

    private final WebClient webClient;
    private final Map<String, CachedRates> ratesCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 3600_000; // 1 hour

    public CurrencyService() {
        this.webClient = WebClient.builder()
                .baseUrl("https://open.er-api.com/v6")
                .build();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getRates(String baseCurrency) {
        String key = baseCurrency.toUpperCase();
        CachedRates cached = ratesCache.get(key);
        if (cached != null && !cached.isExpired()) {
            return cached.data;
        }

        try {
            Map<String, Object> response = webClient.get()
                    .uri("/latest/{base}", key)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && "success".equals(response.get("result"))) {
                ratesCache.put(key, new CachedRates(response));
                return response;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch currency rates for {}: {}", key, e.getMessage());
        }

        // Return cached even if expired, as fallback
        if (cached != null) return cached.data;
        return Map.of("result", "error", "error-type", "service-unavailable");
    }

    @SuppressWarnings("unchecked")
    public double convertCurrency(double amount, String from, String to) {
        if (from.equalsIgnoreCase(to)) return amount;

        Map<String, Object> ratesData = getRates(from.toUpperCase());
        Object ratesObj = ratesData.get("rates");
        if (ratesObj instanceof Map) {
            Map<String, Object> rates = (Map<String, Object>) ratesObj;
            Object rateObj = rates.get(to.toUpperCase());
            if (rateObj != null) {
                double rate = ((Number) rateObj).doubleValue();
                return Math.round(amount * rate * 100.0) / 100.0;
            }
        }
        log.warn("Could not convert {} {} to {}. Returning original amount.", amount, from, to);
        return amount;
    }

    private static class CachedRates {
        final Map<String, Object> data;
        final long timestamp;

        CachedRates(Map<String, Object> data) {
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_TTL_MS;
        }
    }
}
