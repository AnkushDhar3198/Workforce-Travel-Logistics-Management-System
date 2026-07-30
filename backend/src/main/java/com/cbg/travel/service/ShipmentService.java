package com.cbg.travel.service;

import com.cbg.travel.entity.Shipment;
import com.cbg.travel.entity.TravelRequest;
import com.cbg.travel.repository.ShipmentRepository;
import com.cbg.travel.repository.TravelRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final TravelRequestRepository travelRequestRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public Shipment createShipment(Shipment shipment, Long userId) {
        if (shipment.getStatus() == null) {
            shipment.setStatus("PREPARING");
        }
        Shipment saved = shipmentRepository.save(shipment);
        auditLogService.log(userId, "CREATE_SHIPMENT", "Shipment", saved.getId());

        // Notify linked employee
        notifyLinkedEmployee(saved, "A physical asset shipment '" + shipment.getDescription() + "' has been created for your trip.");
        return saved;
    }

    public Shipment updateShipment(Long id, Shipment updated, Long userId) {
        Shipment existing = shipmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found"));

        existing.setDescription(updated.getDescription());
        existing.setType(updated.getType());
        existing.setOrigin(updated.getOrigin());
        existing.setDestination(updated.getDestination());
        existing.setCarrier(updated.getCarrier());
        existing.setCustomsDocs(updated.getCustomsDocs());
        existing.setExpectedDelivery(updated.getExpectedDelivery());
        existing.setActualDelivery(updated.getActualDelivery());
        
        String oldStatus = existing.getStatus();
        existing.setStatus(updated.getStatus());

        Shipment saved = shipmentRepository.save(existing);
        auditLogService.log(userId, "UPDATE_SHIPMENT", "Shipment", saved.getId());

        if (!Objects.equals(oldStatus, saved.getStatus())) {
            notifyLinkedEmployee(saved, "Your linked shipment '" + saved.getDescription() + "' is now: " + saved.getStatus());
        }

        return saved;
    }

    public Shipment updateStatus(Long id, String status, Long userId) {
        Shipment existing = shipmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found"));

        String oldStatus = existing.getStatus();
        existing.setStatus(status);
        if ("DELIVERED".equals(status)) {
            existing.setActualDelivery(LocalDate.now());
        }
        Shipment saved = shipmentRepository.save(existing);
        auditLogService.log(userId, "SHIPMENT_STATUS_CHANGE", "Shipment", saved.getId());

        if (!oldStatus.equals(status)) {
            notifyLinkedEmployee(saved, "Your linked shipment '" + saved.getDescription() + "' status changed to " + status);
        }

        return saved;
    }

    private void notifyLinkedEmployee(Shipment shipment, String message) {
        if (shipment.getLinkedTravelRequestId() != null) {
            travelRequestRepository.findById(shipment.getLinkedTravelRequestId()).ifPresent(req -> {
                notificationService.sendNotification(
                        req.getEmployeeId(),
                        "SHIPMENT",
                        message
                );
            });
        }
    }

    public List<Shipment> getEmployeeShipments(Long employeeId) {
        List<TravelRequest> employeeRequests = travelRequestRepository.findByEmployeeId(employeeId);
        List<Long> reqIds = employeeRequests.stream().map(TravelRequest::getId).collect(Collectors.toList());
        if (reqIds.isEmpty()) {
            return new ArrayList<>();
        }
        return shipmentRepository.findByLinkedTravelRequestIdIn(reqIds);
    }

    public List<Shipment> getAtRiskShipments() {
        List<Shipment> allShipments = shipmentRepository.findAll();
        List<Shipment> atRisk = new ArrayList<>();
        
        for (Shipment s : allShipments) {
            if (s.getLinkedTravelRequestId() != null && s.getExpectedDelivery() != null) {
                travelRequestRepository.findById(s.getLinkedTravelRequestId()).ifPresent(req -> {
                    if (s.getExpectedDelivery().isAfter(req.getStartDate()) && !s.getStatus().equals("DELIVERED")) {
                        atRisk.add(s);
                    }
                });
            }
        }
        
        return atRisk;
    }

    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }

    public Shipment getShipmentById(Long id) {
        return shipmentRepository.findById(id).orElse(null);
    }
}
