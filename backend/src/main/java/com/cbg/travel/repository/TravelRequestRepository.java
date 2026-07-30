package com.cbg.travel.repository;

import com.cbg.travel.entity.TravelRequest;
import com.cbg.travel.entity.TravelRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TravelRequestRepository extends JpaRepository<TravelRequest, Long> {
    List<TravelRequest> findByEmployeeId(Long employeeId);
    List<TravelRequest> findByEmployeeIdIn(List<Long> employeeIds);
    List<TravelRequest> findByStatus(TravelRequestStatus status);
}
