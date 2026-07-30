package com.cbg.travel.repository;

import com.cbg.travel.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByLinkedTravelRequestId(Long travelRequestId);
    List<Shipment> findByLinkedTravelRequestIdIn(List<Long> travelRequestIds);
    List<Shipment> findByStatus(String status);
}
