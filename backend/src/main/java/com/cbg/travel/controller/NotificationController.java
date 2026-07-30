package com.cbg.travel.controller;

import com.cbg.travel.entity.Notification;
import com.cbg.travel.entity.User;
import com.cbg.travel.repository.NotificationRepository;
import com.cbg.travel.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@RequestParam(required = false) Boolean unreadOnly) {
        User user = authService.getCurrentUserEntity();
        if (Boolean.TRUE.equals(unreadOnly)) {
            return ResponseEntity.ok(notificationRepository.findByUserIdAndReadStatusOrderByCreatedAtDesc(user.getId(), false));
        }
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        User user = authService.getCurrentUserEntity();
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        
        if (!n.getUserId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to notification");
        }
        
        n.setReadStatus(true);
        return ResponseEntity.ok(notificationRepository.save(n));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> readAll() {
        User user = authService.getCurrentUserEntity();
        List<Notification> unread = notificationRepository.findByUserIdAndReadStatusOrderByCreatedAtDesc(user.getId(), false);
        for (Notification n : unread) {
            n.setReadStatus(true);
        }
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok().build();
    }
}
