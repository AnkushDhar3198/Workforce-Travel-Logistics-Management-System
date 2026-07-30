package com.cbg.travel.repository;

import com.cbg.travel.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByTravelRequestId(Long travelRequestId);
    List<Expense> findByEmployeeId(Long employeeId);
    List<Expense> findByEmployeeIdIn(List<Long> employeeIds);
    List<Expense> findByStatus(String status);
}
