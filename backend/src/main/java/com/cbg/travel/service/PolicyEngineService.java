package com.cbg.travel.service;

import com.cbg.travel.entity.TravelRequest;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class PolicyEngineService {

    public List<String> evaluatePolicy(TravelRequest request) {
        List<String> violations = new ArrayList<>();
        
        if (request.getStartDate() == null || request.getEndDate() == null) {
            return violations;
        }

        // Rule 1: Booking Lead Time (must book at least 14 days in advance)
        long leadTimeDays = ChronoUnit.DAYS.between(LocalDate.now(), request.getStartDate());
        if (leadTimeDays < 14) {
            violations.add("LATE_BOOKING: Request submitted " + leadTimeDays + " days before travel (Policy requires 14 days lead time).");
        }

        // Rule 2: Hotel & Travel Per Diem (Daily average cost cap of $300)
        long duration = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());
        if (duration <= 0) {
            duration = 1; // prevent division by zero
        }
        
        double dailyCost = request.getEstimatedCost() / duration;
        if (dailyCost > 300.0) {
            violations.add(String.format("BUDGET_EXCEEDED: Estimated daily cost is $%.2f which exceeds the regional per diem cap of $300.00.", dailyCost));
        }

        // Rule 3: Flight Class Constraint
        // Flag flight class policy violations if estimated cost is extremely high (indicating business class flight)
        if (request.getEstimatedCost() > 2500.0 && !request.getPurpose().toLowerCase().contains("critical")) {
            violations.add("FLIGHT_CLASS_VIOLATION: Premium flight class detected based on estimated cost ($" + request.getEstimatedCost() + "). Business class requires 'critical' client-facing justification.");
        }

        return violations;
    }
}
