package com.cbg.travel.service;

import com.cbg.travel.entity.*;
import com.cbg.travel.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TravelRequestService {

    private final TravelRequestRepository travelRequestRepository;
    private final UserRepository userRepository;
    private final ApprovalRepository approvalRepository;
    private final BookingRepository bookingRepository;
    private final PolicyEngineService policyEngineService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public TravelRequest createTravelRequest(TravelRequest request, User employee) {
        request.setEmployeeId(employee.getId());
        request.setCreatedAt(LocalDateTime.now());
        
        // Evaluate policy flags
        List<String> violations = policyEngineService.evaluatePolicy(request);
        request.setPolicyFlagsList(violations);
        
        if (request.getStatus() == null) {
            request.setStatus(TravelRequestStatus.DRAFT);
        }

        TravelRequest saved = travelRequestRepository.save(request);
        auditLogService.log(employee.getId(), "CREATE_TRAVEL_REQUEST", "TravelRequest", saved.getId());
        
        if (saved.getStatus() == TravelRequestStatus.PENDING) {
            triggerManagerNotification(saved, employee);
        }

        return saved;
    }

    public TravelRequest submitTravelRequest(Long id, User employee) {
        TravelRequest request = travelRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Travel request not found"));
        
        if (!request.getEmployeeId().equals(employee.getId())) {
            throw new SecurityException("Unauthorized access to submit this travel request");
        }

        request.setStatus(TravelRequestStatus.PENDING);
        
        // Run policy evaluation again in case dates/costs changed
        List<String> violations = policyEngineService.evaluatePolicy(request);
        request.setPolicyFlagsList(violations);
        
        TravelRequest saved = travelRequestRepository.save(request);
        auditLogService.log(employee.getId(), "SUBMIT_TRAVEL_REQUEST", "TravelRequest", saved.getId());
        
        triggerManagerNotification(saved, employee);
        
        return saved;
    }

    private void triggerManagerNotification(TravelRequest request, User employee) {
        if (employee.getManagerId() != null) {
            notificationService.sendNotification(
                    employee.getManagerId(),
                    "APPROVAL",
                    "New travel request from " + employee.getName() + " for " + request.getDestination() + " requires review."
            );
        }
    }

    public TravelRequest approveRequest(Long id, Long approverId, String comment) {
        TravelRequest request = travelRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Travel request not found"));
        
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new IllegalArgumentException("Approver not found"));

        // Check multi-level approvals: threshold is $5000
        int currentLevel = approvalRepository.findByTravelRequestId(id).size() + 1;
        
        Approval approval = Approval.builder()
                .travelRequestId(id)
                .approverId(approverId)
                .level(currentLevel)
                .decision("APPROVED")
                .comment(comment)
                .decidedAt(LocalDateTime.now())
                .build();
        approvalRepository.save(approval);

        boolean isHighCost = request.getEstimatedCost() > 5000.0;
        
        if (isHighCost && currentLevel < 2) {
            // Needs level 2 approval (e.g. from finance or CTM)
            request.setStatus(TravelRequestStatus.PENDING);
            notificationService.sendNotification(
                    request.getEmployeeId(),
                    "APPROVAL",
                    "Your travel request is approved by manager (Level 1) and now pending final Finance review due to high cost ($" + request.getEstimatedCost() + ")."
            );
            // Notify finance
            List<User> financeUsers = userRepository.findByRole(UserRole.FINANCE_PROCUREMENT);
            for (User f : financeUsers) {
                notificationService.sendNotification(
                        f.getId(),
                        "APPROVAL",
                        "High cost travel request from user " + request.getEmployeeId() + " requires final approval."
                );
            }
        } else {
            // Level 1 (if low cost) or Level 2 complete
            request.setStatus(TravelRequestStatus.APPROVED);
            notificationService.sendNotification(
                    request.getEmployeeId(),
                    "APPROVAL",
                    "Your travel request to " + request.getDestination() + " has been fully approved."
            );
        }

        TravelRequest saved = travelRequestRepository.save(request);
        auditLogService.log(approverId, "APPROVE_TRAVEL_REQUEST", "TravelRequest", saved.getId());
        return saved;
    }

    public TravelRequest rejectRequest(Long id, Long approverId, String comment) {
        TravelRequest request = travelRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Travel request not found"));

        Approval approval = Approval.builder()
                .travelRequestId(id)
                .approverId(approverId)
                .level(approvalRepository.findByTravelRequestId(id).size() + 1)
                .decision("REJECTED")
                .comment(comment)
                .decidedAt(LocalDateTime.now())
                .build();
        approvalRepository.save(approval);

        request.setStatus(TravelRequestStatus.REJECTED);
        travelRequestRepository.save(request);

        notificationService.sendNotification(
                request.getEmployeeId(),
                "APPROVAL",
                "Your travel request to " + request.getDestination() + " was rejected. Reason: " + comment
        );

        auditLogService.log(approverId, "REJECT_TRAVEL_REQUEST", "TravelRequest", request.getId());
        return request;
    }

    public Booking createBooking(Long requestId, Booking booking, Long userId) {
        TravelRequest request = travelRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Travel request not found"));

        if (!request.getStatus().equals(TravelRequestStatus.APPROVED)) {
            throw new IllegalStateException("Cannot create bookings for non-approved travel request");
        }

        booking.setTravelRequestId(requestId);
        booking.setBookedAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(
                request.getEmployeeId(),
                "BOOKING",
                "New " + booking.getType() + " booking confirmed with " + booking.getVendor() + "."
        );

        auditLogService.log(userId, "CREATE_BOOKING", "Booking", saved.getId());
        return saved;
    }

    public List<TravelRequest> getRequestsForEmployee(Long employeeId) {
        return travelRequestRepository.findByEmployeeId(employeeId);
    }

    public List<TravelRequest> getDepartmentalRequests(User manager) {
        List<User> deptEmployees = userRepository.findByDepartment(manager.getDepartment());
        List<Long> employeeIds = deptEmployees.stream().map(User::getId).collect(Collectors.toList());
        return travelRequestRepository.findByEmployeeIdIn(employeeIds);
    }

    public List<TravelRequest> getAllRequests() {
        return travelRequestRepository.findAll();
    }

    public TravelRequest getRequestById(Long id) {
        return travelRequestRepository.findById(id).orElse(null);
    }
}
