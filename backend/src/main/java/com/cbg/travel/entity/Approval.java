package com.cbg.travel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "approvals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Approval {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "travel_request_id", nullable = false)
    private Long travelRequestId;

    @Column(name = "approver_id", nullable = false)
    private Long approverId;

    @Column(nullable = false)
    private Integer level;

    @Column(nullable = false)
    private String decision; // APPROVED, REJECTED

    @Column(length = 1000)
    private String comment;

    @Column(name = "decided_at", nullable = false)
    private LocalDateTime decidedAt;
}
