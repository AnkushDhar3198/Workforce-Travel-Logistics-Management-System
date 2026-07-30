package com.cbg.travel.controller;

import com.cbg.travel.entity.Expense;
import com.cbg.travel.entity.User;
import com.cbg.travel.service.AuthService;
import com.cbg.travel.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<Expense> create(@RequestBody Expense expense) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(expenseService.submitExpense(expense, user.getId()));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Expense> approve(@PathVariable Long id) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(expenseService.approveExpense(id, user.getId()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Expense> reject(@PathVariable Long id) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(expenseService.rejectExpense(id, user.getId()));
    }

    @PostMapping("/{id}/reimburse")
    public ResponseEntity<Expense> reimburse(@PathVariable Long id) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(expenseService.reimburseExpense(id, user.getId()));
    }

    @GetMapping("/employee")
    public ResponseEntity<List<Expense>> getEmployeeExpenses() {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(expenseService.getEmployeeExpenses(user.getId()));
    }

    @GetMapping("/department")
    public ResponseEntity<List<Expense>> getDepartmentExpenses() {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(expenseService.getDepartmentalExpenses(user));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Expense>> getPendingExpenses() {
        return ResponseEntity.ok(expenseService.getExpensesByStatus("SUBMITTED"));
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getAll() {
        return ResponseEntity.ok(expenseService.getAllExpenses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getById(@PathVariable Long id) {
        return ResponseEntity.ok(expenseService.getExpenseById(id));
    }

    @GetMapping("/{id}/fraud-check")
    public ResponseEntity<Map<String, Boolean>> checkFraud(@PathVariable Long id) {
        Expense expense = expenseService.getExpenseById(id);
        boolean isFraud = expense != null && expenseService.checkFraudRisk(expense);
        Map<String, Boolean> result = new HashMap<>();
        result.put("isFraudRisk", isFraud);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        Map<String, String> response = new HashMap<>();
        try {
            String uploadDir = "uploads";
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path path = Paths.get(uploadDir, filename);
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

            response.put("url", "http://localhost:8080/uploads/" + filename);
            response.put("filename", file.getOriginalFilename());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            response.put("error", "File upload failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
