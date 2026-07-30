package com.cbg.travel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "travel_request_id", nullable = false)
    private Long travelRequestId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Double amount;

    @Column(name = "receipt_url")
    private String receiptUrl;

    @Column(name = "ocr_extracted_data", length = 2000)
    private String ocrExtractedData; // JSON details extracted

    @Column(nullable = false)
    private String status; // SUBMITTED, APPROVED, REJECTED, REIMBURSED

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;
}
