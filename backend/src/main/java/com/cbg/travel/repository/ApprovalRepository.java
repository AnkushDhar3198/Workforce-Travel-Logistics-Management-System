package com.cbg.travel.repository;

import com.cbg.travel.entity.Approval;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {
    List<Approval> findByTravelRequestId(Long travelRequestId);
}
