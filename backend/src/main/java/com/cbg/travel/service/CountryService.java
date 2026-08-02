package com.cbg.travel.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CountryService {

    private final WebClient webClient;
    private List<Map<String, String>> cachedCountries = new ArrayList<>();

    public CountryService() {
        this.webClient = WebClient.builder()
                .baseUrl("https://restcountries.com/v3.1")
                .build();
    }

    @PostConstruct
    public void loadCountries() {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> response = webClient.get()
                    .uri("/all?fields=name,cca2,capital,region,subregion,timezones,currencies,languages")
                    .retrieve()
                    .bodyToMono(List.class)
                    .block();

            if (response != null) {
                cachedCountries = response.stream()
                        .map(this::parseCountry)
                        .filter(Objects::nonNull)
                        .sorted(Comparator.comparing(m -> m.getOrDefault("name", "")))
                        .collect(Collectors.toList());
                log.info("Loaded {} countries from RestCountries API", cachedCountries.size());
            }
        } catch (Exception e) {
            log.warn("Failed to load countries from API, using fallback: {}", e.getMessage());
            loadFallbackCountries();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> parseCountry(Map<String, Object> raw) {
        try {
            Map<String, String> country = new LinkedHashMap<>();
            Map<String, Object> nameObj = (Map<String, Object>) raw.get("name");
            country.put("name", nameObj != null ? String.valueOf(nameObj.get("common")) : "Unknown");
            country.put("code", String.valueOf(raw.getOrDefault("cca2", "")));
            country.put("region", String.valueOf(raw.getOrDefault("region", "")));
            country.put("subregion", String.valueOf(raw.getOrDefault("subregion", "")));

            Object capitalObj = raw.get("capital");
            if (capitalObj instanceof List && !((List<?>) capitalObj).isEmpty()) {
                country.put("capital", String.valueOf(((List<?>) capitalObj).get(0)));
            } else {
                country.put("capital", "");
            }

            Object tzObj = raw.get("timezones");
            if (tzObj instanceof List && !((List<?>) tzObj).isEmpty()) {
                country.put("timezone", String.valueOf(((List<?>) tzObj).get(0)));
            }

            Object currObj = raw.get("currencies");
            if (currObj instanceof Map && !((Map<?, ?>) currObj).isEmpty()) {
                String firstKey = String.valueOf(((Map<?, ?>) currObj).keySet().iterator().next());
                country.put("currencyCode", firstKey);
            }

            Object langObj = raw.get("languages");
            if (langObj instanceof Map && !((Map<?, ?>) langObj).isEmpty()) {
                String firstLang = String.valueOf(((Map<?, ?>) langObj).values().iterator().next());
                country.put("language", firstLang);
            }

            return country;
        } catch (Exception e) {
            return null;
        }
    }

    private void loadFallbackCountries() {
        String[][] data = {
                {"India", "IN"}, {"United States", "US"}, {"United Kingdom", "GB"},
                {"Germany", "DE"}, {"France", "FR"}, {"Australia", "AU"},
                {"Canada", "CA"}, {"Japan", "JP"}, {"Singapore", "SG"},
                {"United Arab Emirates", "AE"}, {"China", "CN"}, {"Brazil", "BR"},
                {"South Korea", "KR"}, {"Italy", "IT"}, {"Spain", "ES"},
                {"Netherlands", "NL"}, {"Switzerland", "CH"}, {"Sweden", "SE"},
                {"Norway", "NO"}, {"Turkey", "TR"}, {"Saudi Arabia", "SA"},
                {"Qatar", "QA"}, {"Thailand", "TH"}, {"Malaysia", "MY"},
                {"Indonesia", "ID"}, {"Philippines", "PH"}, {"Mexico", "MX"},
                {"South Africa", "ZA"}, {"Nigeria", "NG"}, {"Kenya", "KE"},
        };
        cachedCountries = new ArrayList<>();
        for (String[] c : data) {
            Map<String, String> m = new LinkedHashMap<>();
            m.put("name", c[0]);
            m.put("code", c[1]);
            cachedCountries.add(m);
        }
    }

    public List<Map<String, String>> getAllCountries() {
        return cachedCountries;
    }

    public Map<String, String> getCountryByCode(String code) {
        return cachedCountries.stream()
                .filter(c -> code.equalsIgnoreCase(c.get("code")))
                .findFirst()
                .orElse(null);
    }
}
