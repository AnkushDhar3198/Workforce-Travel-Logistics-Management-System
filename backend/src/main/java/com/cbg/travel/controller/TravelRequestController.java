package com.cbg.travel.controller;

import com.cbg.travel.entity.*;
import com.cbg.travel.service.AuthService;
import com.cbg.travel.service.TravelRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/travel")
@RequiredArgsConstructor
public class TravelRequestController {

    private final TravelRequestService travelRequestService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<TravelRequest> create(@RequestBody TravelRequest request) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(travelRequestService.createTravelRequest(request, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TravelRequest> update(@PathVariable Long id, @RequestBody TravelRequest updates) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(travelRequestService.updateDraftRequest(id, updates, user));
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<TravelRequest> submit(@PathVariable Long id) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(travelRequestService.submitTravelRequest(id, user));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<TravelRequest> cancel(@PathVariable Long id) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(travelRequestService.cancelRequest(id, user));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<TravelRequest> approve(@PathVariable Long id, @RequestParam(required = false, defaultValue = "") String comment) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(travelRequestService.approveRequest(id, user.getId(), comment));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<TravelRequest> reject(@PathVariable Long id, @RequestParam(required = false, defaultValue = "") String comment) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(travelRequestService.rejectRequest(id, user.getId(), comment));
    }

    @PostMapping("/{id}/bookings")
    public ResponseEntity<Booking> book(@PathVariable Long id, @RequestBody Booking booking) {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(travelRequestService.createBooking(id, booking, user.getId()));
    }

    @GetMapping("/{id}/bookings")
    public ResponseEntity<List<Booking>> getBookings(@PathVariable Long id) {
        return ResponseEntity.ok(travelRequestService.getBookingsForRequest(id));
    }

    @GetMapping("/employee")
    public ResponseEntity<List<TravelRequest>> getEmployeeRequests() {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(travelRequestService.getRequestsForEmployee(user.getId()));
    }

    @GetMapping("/department")
    public ResponseEntity<List<TravelRequest>> getDepartmentalRequests() {
        User user = authService.getCurrentUserEntity();
        return ResponseEntity.ok(travelRequestService.getDepartmentalRequests(user));
    }

    @GetMapping
    public ResponseEntity<List<TravelRequest>> getAll() {
        return ResponseEntity.ok(travelRequestService.getAllRequests());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TravelRequest> getById(@PathVariable Long id) {
        return ResponseEntity.ok(travelRequestService.getRequestById(id));
    }
}
