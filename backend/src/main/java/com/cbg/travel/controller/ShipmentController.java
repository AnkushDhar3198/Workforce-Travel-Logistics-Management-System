package com.cbg.travel.controller;

import com.cbg.travel.entity.Shipment;
import com.cbg.travel.entity.User;
import com.cbg.travel.service.AuthService;
import com.cbg.travel.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<Shipment> create(@RequestBody Shipment shipment) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(shipmentService.createShipment(shipment, user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Shipment> update(@PathVariable Long id, @RequestBody Shipment shipment) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(shipmentService.updateShipment(id, shipment, user.getId()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Shipment> updateStatus(@PathVariable Long id, @RequestParam String status) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(shipmentService.updateStatus(id, status, user.getId()));
    }

    @GetMapping("/employee")
    public ResponseEntity<List<Shipment>> getEmployeeShipments() {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(shipmentService.getEmployeeShipments(user.getId()));
    }

    @GetMapping("/at-risk")
    public ResponseEntity<List<Shipment>> getAtRiskShipments() {
        return ResponseEntity.ok(shipmentService.getAtRiskShipments());
    }

    @GetMapping
    public ResponseEntity<List<Shipment>> getAll() {
        return ResponseEntity.ok(shipmentService.getAllShipments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shipment> getById(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.getShipmentById(id));
    }
}
