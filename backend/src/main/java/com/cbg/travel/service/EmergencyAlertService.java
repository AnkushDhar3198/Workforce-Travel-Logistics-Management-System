package com.cbg.travel.service;

import com.cbg.travel.entity.EmergencyAlert;
import com.cbg.travel.entity.User;
import com.cbg.travel.entity.UserRole;
import com.cbg.travel.repository.EmergencyAlertRepository;
import com.cbg.travel.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmergencyAlertService {

    private final EmergencyAlertRepository emergencyAlertRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public EmergencyAlert triggerSOS(Long employeeId, String location) {
        EmergencyAlert alert = EmergencyAlert.builder()
                .employeeId(employeeId)
                .location(location)
                .status("ACTIVE")
                .triggeredAt(LocalDateTime.now())
                .build();
        EmergencyAlert saved = emergencyAlertRepository.save(alert);
        
        auditLogService.log(employeeId, "TRIGGER_SOS_ALERT", "EmergencyAlert", saved.getId());

        // Notify all Security Officers in the department
        List<User> securityOfficers = userRepository.findByRole(UserRole.SECURITY_RISK_OFFICER);
        
        userRepository.findById(employeeId).ifPresent(employee -> {
            String alertMessage = "EMERGENCY: SOS triggered by " + employee.getName() + " in location: " + location;
            for (User officer : securityOfficers) {
                notificationService.sendNotification(
                        officer.getId(),
                        "EMERGENCY",
                        alertMessage
                );
            }
        });

        return saved;
    }

    public EmergencyAlert resolveAlert(Long id, Long resolverId, String notes) {
        EmergencyAlert alert = emergencyAlertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Emergency alert not found"));

        alert.setStatus("RESOLVED");
        alert.setResolvedAt(LocalDateTime.now());
        alert.setNotes(notes);

        EmergencyAlert saved = emergencyAlertRepository.save(alert);
        auditLogService.log(resolverId, "RESOLVE_SOS_ALERT", "EmergencyAlert", saved.getId());

        notificationService.sendNotification(
                saved.getEmployeeId(),
                "EMERGENCY",
                "Your emergency status alert has been marked RESOLVED by Security. Notes: " + notes
        );

        return saved;
    }

    public List<EmergencyAlert> getActiveAlerts() {
        return emergencyAlertRepository.findByStatus("ACTIVE");
    }

    public List<EmergencyAlert> getAllAlerts() {
        return emergencyAlertRepository.findAll();
    }
}
