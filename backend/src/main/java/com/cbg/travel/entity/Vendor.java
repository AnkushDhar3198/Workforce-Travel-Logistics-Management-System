package com.cbg.travel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "vendors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vendor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // AIRLINE, HOTEL, TRANSPORT, LOGISTICS

    @Column(name = "contract_terms", length = 1000)
    private String contractTerms;

    @Column(name = "performance_rating")
    private Double performanceRating;

    @Column(name = "is_preferred", nullable = false)
    private Boolean isPreferred;
}
