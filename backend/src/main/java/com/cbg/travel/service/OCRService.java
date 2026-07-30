package com.cbg.travel.service;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.Random;

@Service
public class OCRService {

    private final Random random = new Random();

    public String performMockOCR(String filename) {
        String name = filename.toLowerCase();
        double amount;
        String vendor;
        String category;
        String date = LocalDate.now().minusDays(1).toString();

        if (name.contains("hotel") || name.contains("stay") || name.contains("lodging")) {
            amount = 150.0 + random.nextInt(400);
            vendor = "Hilton Worldwide Hotels";
            category = "HOTEL";
        } else if (name.contains("flight") || name.contains("delta") || name.contains("air")) {
            amount = 300.0 + random.nextInt(800);
            vendor = "Delta Air Lines";
            category = "FLIGHT";
        } else if (name.contains("taxi") || name.contains("uber") || name.contains("ride")) {
            amount = 15.0 + random.nextInt(45);
            vendor = "Uber Technologies Inc.";
            category = "TRANSPORT";
        } else if (name.contains("meal") || name.contains("food") || name.contains("dinner") || name.contains("lunch")) {
            amount = 25.0 + random.nextInt(120);
            vendor = "Gourmet Bistro & Grill";
            category = "MEAL";
        } else {
            // Default generic expense
            amount = 45.0 + random.nextInt(150);
            vendor = "Corporate Supplies Ltd.";
            category = "OTHER";
        }

        return String.format(
            "{\"vendor\":\"%s\",\"amount\":%.2f,\"date\":\"%s\",\"category\":\"%s\",\"confidence\":0.98}",
            vendor, amount, date, category
        );
    }
}
