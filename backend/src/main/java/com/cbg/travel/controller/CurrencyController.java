package com.cbg.travel.controller;

import com.cbg.travel.service.CurrencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyService currencyService;

    @GetMapping("/rates")
    public ResponseEntity<Map<String, Object>> getRates(@RequestParam(defaultValue = "USD") String base) {
        return ResponseEntity.ok(currencyService.getRates(base));
    }

    @GetMapping("/convert")
    public ResponseEntity<Map<String, Object>> convert(
            @RequestParam double amount,
            @RequestParam String from,
            @RequestParam String to) {
        double converted = currencyService.convertCurrency(amount, from, to);
        return ResponseEntity.ok(Map.of(
                "originalAmount", amount,
                "from", from.toUpperCase(),
                "to", to.toUpperCase(),
                "convertedAmount", converted
        ));
    }
}
