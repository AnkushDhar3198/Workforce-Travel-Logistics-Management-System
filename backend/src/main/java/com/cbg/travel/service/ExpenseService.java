package com.cbg.travel.service;

import com.cbg.travel.entity.Expense;
import com.cbg.travel.entity.User;
import com.cbg.travel.repository.ExpenseRepository;
import com.cbg.travel.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final OCRService ocrService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Expense submitExpense(Expense expense, Long employeeId) {
        expense.setEmployeeId(employeeId);
        expense.setStatus("SUBMITTED");
        expense.setSubmittedAt(LocalDateTime.now());

        // Perform Mock OCR scanning if file is provided
        if (expense.getReceiptUrl() != null && !expense.getReceiptUrl().isEmpty()) {
            String ocrJson = ocrService.performMockOCR(expense.getReceiptUrl());
            expense.setOcrExtractedData(ocrJson);
        }

        Expense saved = expenseRepository.save(expense);
        auditLogService.log(employeeId, "SUBMIT_EXPENSE", "Expense", saved.getId());
        
        // Notify Manager
        userRepository.findById(employeeId).ifPresent(emp -> {
            if (emp.getManagerId() != null) {
                notificationService.sendNotification(
                        emp.getManagerId(),
                        "EXPENSE",
                        "Expense claim of $" + expense.getAmount() + " submitted by " + emp.getName() + " for review."
                );
            }
        });

        return saved;
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
                "Your expense claim of $" + saved.getAmount() + " was approved."
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
                "Your expense claim of $" + saved.getAmount() + " was rejected."
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
                "Your approved expense claim of $" + saved.getAmount() + " has been reimbursed to your bank account."
        );

        return saved;
    }

    public boolean checkFraudRisk(Expense expense) {
        if (expense.getOcrExtractedData() == null || expense.getOcrExtractedData().isEmpty()) {
            return false;
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> ocrMap = objectMapper.readValue(expense.getOcrExtractedData(), Map.class);
            Object amountObj = ocrMap.get("amount");
            if (amountObj != null) {
                double ocrAmount = Double.parseDouble(amountObj.toString());
                // Flag if claimed amount deviates from OCR by more than $10 or 10%
                return Math.abs(expense.getAmount() - ocrAmount) > 10.0;
            }
        } catch (Exception e) {
            // parsing error -> return no risk
        }
        return false;
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
