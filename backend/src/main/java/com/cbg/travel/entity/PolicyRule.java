package com.cbg.travel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "policy_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_type", nullable = false)
    private String ruleType; // FLIGHT_CLASS, HOTEL_BUDGET, BOOKING_LEAD_TIME

    @Column(name = "condition_json", length = 2000, nullable = false)
    private String conditionJson; // Rule conditions: budget cap, duration limit, days limit

    @Column(nullable = false)
    private String region; // GLOBAL, APAC, EMEA, AMER
}
