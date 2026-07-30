package com.cbg.travel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "travel_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private String destination;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private String purpose;

    @Column(name = "estimated_cost", nullable = false)
    private Double estimatedCost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TravelRequestStatus status;

    @Column(name = "policy_flags", length = 2000)
    private String policyFlags; // Comma-separated list of flags

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public List<String> getPolicyFlagsList() {
        if (this.policyFlags == null || this.policyFlags.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.asList(this.policyFlags.split(","));
    }

    public void setPolicyFlagsList(List<String> flags) {
        if (flags == null || flags.isEmpty()) {
            this.policyFlags = "";
        } else {
            this.policyFlags = String.join(",", flags);
        }
    }
}
