package com.cbg.travel.controller;

import com.cbg.travel.entity.EmergencyAlert;
import com.cbg.travel.entity.User;
import com.cbg.travel.service.AuthService;
import com.cbg.travel.service.EmergencyAlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class EmergencyAlertController {

    private final EmergencyAlertService emergencyAlertService;
    private final AuthService authService;

    @PostMapping("/sos")
    public ResponseEntity<EmergencyAlert> triggerSOS(@RequestParam String location) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(emergencyAlertService.triggerSOS(user.getId(), location));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<EmergencyAlert> resolve(@PathVariable Long id, @RequestParam(required = false, defaultValue = "") String notes) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(emergencyAlertService.resolveAlert(id, user.getId(), notes));
    }

    @GetMapping("/active")
    public ResponseEntity<List<EmergencyAlert>> getActive() {
        return ResponseEntity.ok(emergencyAlertService.getActiveAlerts());
    }

    @GetMapping
    public ResponseEntity<List<EmergencyAlert>> getAll() {
        return ResponseEntity.ok(emergencyAlertService.getAllAlerts());
    }
}
