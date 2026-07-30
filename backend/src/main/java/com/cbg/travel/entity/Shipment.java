package com.cbg.travel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "linked_travel_request_id")
    private Long linkedTravelRequestId;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String type; // SAMPLE, PROTOTYPE, BOOTH, MARKETING

    @Column(nullable = false)
    private String origin;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private String carrier;

    @Column(name = "customs_docs", length = 2000)
    private String customsDocs; // Comma-separated list of files or carnet checks

    @Column(nullable = false)
    private String status; // PREPARING, DISPATCHED, IN_TRANSIT, CUSTOMS_HOLD, DELIVERED

    @Column(name = "expected_delivery")
    private LocalDate expectedDelivery;

    @Column(name = "actual_delivery")
    private LocalDate actualDelivery;
}
