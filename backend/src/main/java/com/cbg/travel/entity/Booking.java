package com.cbg.travel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "travel_request_id", nullable = false)
    private Long travelRequestId;

    @Column(nullable = false)
    private String type; // FLIGHT, HOTEL, TRANSPORT

    @Column(nullable = false)
    private String vendor;

    @Column(length = 2000, nullable = false)
    private String details; // JSON or text details

    @Column(nullable = false)
    private Double cost;

    @Column(name = "booked_at", nullable = false)
    private LocalDateTime bookedAt;
}
