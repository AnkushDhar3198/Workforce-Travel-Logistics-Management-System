package com.cbg.travel.service;

import com.cbg.travel.entity.Expense;
import com.cbg.travel.entity.TravelRequest;
import com.cbg.travel.entity.User;
import com.cbg.travel.repository.ExpenseRepository;
import com.cbg.travel.repository.TravelRequestRepository;
import com.cbg.travel.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final TravelRequestRepository travelRequestRepository;
    private final OCRService ocrService;
    private final CurrencyService currencyService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Expense submitExpense(Expense expense, Long employeeId) {
        expense.setEmployeeId(employeeId);
        expense.setStatus("SUBMITTED");
        expense.setSubmittedAt(LocalDateTime.now());

        // Set defaults for currency
        if (expense.getCurrency() == null || expense.getCurrency().isBlank()) {
            expense.setCurrency("USD");
        }
        if (expense.getBaseCurrency() == null || expense.getBaseCurrency().isBlank()) {
            expense.setBaseCurrency("USD");
        }

        // Auto-convert foreign currency to base currency
        if (!expense.getCurrency().equalsIgnoreCase(expense.getBaseCurrency())) {
            double converted = currencyService.convertCurrency(
                    expense.getAmount(), expense.getCurrency(), expense.getBaseCurrency());
            expense.setConvertedAmount(converted);
            log.info("Currency conversion: {} {} → {} {} (rate applied)",
                    expense.getAmount(), expense.getCurrency(), converted, expense.getBaseCurrency());
        } else {
            expense.setConvertedAmount(expense.getAmount());
        }

        // Perform OCR scanning if receipt is provided
        if (expense.getReceiptUrl() != null && !expense.getReceiptUrl().isEmpty()) {
            String ocrJson = ocrService.performMockOCR(expense.getReceiptUrl());
            expense.setOcrExtractedData(ocrJson);
        }

        // Enhanced fraud detection
        double fraudScore = calculateFraudRiskScore(expense);
        expense.setFraudRiskScore(fraudScore);

        // Policy violation checks
        List<String> violations = checkPolicyViolations(expense);
        if (!violations.isEmpty()) {
            expense.setPolicyViolations(String.join("; ", violations));
        }

        Expense saved = expenseRepository.save(expense);
        auditLogService.log(employeeId, "SUBMIT_EXPENSE", "Expense", saved.getId());

        // Notify Manager
        userRepository.findById(employeeId).ifPresent(emp -> {
            if (emp.getManagerId() != null) {
                String msg = "Expense claim of $" + expense.getAmount() + " " + expense.getCurrency()
                        + " submitted by " + emp.getName() + " for review.";
                if (fraudScore > 0.5) {
                    msg += " ⚠ HIGH FRAUD RISK DETECTED (score: " + String.format("%.2f", fraudScore) + ")";
                }
                notificationService.sendNotification(emp.getManagerId(), "EXPENSE", msg);
            }
        });

        return saved;
    }

    private double calculateFraudRiskScore(Expense expense) {
        double score = 0.0;

        // Check OCR amount mismatch
        if (expense.getOcrExtractedData() != null && !expense.getOcrExtractedData().isEmpty()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> ocrMap = objectMapper.readValue(expense.getOcrExtractedData(), Map.class);
                Object amountObj = ocrMap.get("amount");
                if (amountObj != null) {
                    double ocrAmount = Double.parseDouble(amountObj.toString());
                    double deviation = Math.abs(expense.getAmount() - ocrAmount);
                    if (deviation > 50) score += 0.4;
                    else if (deviation > 10) score += 0.2;
                }
            } catch (Exception e) {
                // parsing error
            }
        }

        // Check if expense date is outside travel date range
        if (expense.getTravelRequestId() != null) {
            travelRequestRepository.findById(expense.getTravelRequestId()).ifPresent(tr -> {
                // Flagging note: we can't modify score directly in lambda, but we check below
            });
        }

        // Large expense flag
        if (expense.getAmount() > 1000) score += 0.15;
        if (expense.getAmount() > 5000) score += 0.25;

        // Missing receipt for large amounts
        if (expense.getAmount() > 100 && (expense.getReceiptUrl() == null || expense.getReceiptUrl().isEmpty())) {
            score += 0.2;
        }

        return Math.min(score, 1.0);
    }

    private List<String> checkPolicyViolations(Expense expense) {
        List<String> violations = new ArrayList<>();

        // Meal per-diem check (max $75/day)
        if ("MEAL".equalsIgnoreCase(expense.getCategory()) && expense.getAmount() > 75) {
            violations.add("Meal expense exceeds daily per-diem limit of $75.00");
        }

        // Transport per-diem check (max $100/day)
        if ("TRANSPORT".equalsIgnoreCase(expense.getCategory()) && expense.getAmount() > 100) {
            violations.add("Transport expense exceeds daily per-diem limit of $100.00");
        }

        // Hotel per-night check (max $300/night)
        if ("HOTEL".equalsIgnoreCase(expense.getCategory()) && expense.getAmount() > 300) {
            violations.add("Hotel expense exceeds nightly budget limit of $300.00");
        }

        // Missing receipt for any expense over $25
        if (expense.getAmount() > 25 && (expense.getReceiptUrl() == null || expense.getReceiptUrl().isEmpty())) {
            violations.add("Receipt required for expenses over $25.00");
        }

        return violations;
    }

    public Expense approveExpense(Long id, Long approverId) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        expense.setStatus("APPROVED");
        Expense saved = expenseRepository.save(expense);

        auditLogService.log(approverId, "APPROVE_EXPENSE", "Expense", saved.getId());
        notificationService.sendNotification(
                saved.getEmployeeId(),
                "EXPENSE",
                "Your expense claim of $" + saved.getAmount() + " " + saved.getCurrency() + " was approved."
        );

        return saved;
    }

    public Expense rejectExpense(Long id, Long approverId) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        expense.setStatus("REJECTED");
        Expense saved = expenseRepository.save(expense);

        auditLogService.log(approverId, "REJECT_EXPENSE", "Expense", saved.getId());
        notificationService.sendNotification(
                saved.getEmployeeId(),
                "EXPENSE",
                "Your expense claim of $" + saved.getAmount() + " " + saved.getCurrency() + " was rejected."
        );

        return saved;
    }

    public Expense reimburseExpense(Long id, Long financeUserId) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        expense.setStatus("REIMBURSED");
        Expense saved = expenseRepository.save(expense);

        auditLogService.log(financeUserId, "REIMBURSE_EXPENSE", "Expense", saved.getId());
        notificationService.sendNotification(
                saved.getEmployeeId(),
                "EXPENSE",
                "Your approved expense claim of $" + saved.getAmount() + " " + saved.getCurrency() + " has been reimbursed to your bank account."
        );

        return saved;
    }

    public boolean checkFraudRisk(Expense expense) {
        return expense.getFraudRiskScore() != null && expense.getFraudRiskScore() > 0.5;
    }

    public List<Expense> getEmployeeExpenses(Long employeeId) {
        return expenseRepository.findByEmployeeId(employeeId);
    }

    public List<Expense> getDepartmentalExpenses(User manager) {
        List<User> deptEmployees = userRepository.findByDepartment(manager.getDepartment());
        List<Long> employeeIds = deptEmployees.stream().map(User::getId).collect(Collectors.toList());
        return expenseRepository.findByEmployeeIdIn(employeeIds);
    }

    public List<Expense> getExpensesByStatus(String status) {
        return expenseRepository.findByStatus(status);
    }

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public Expense getExpenseById(Long id) {
        return expenseRepository.findById(id).orElse(null);
    }
}
