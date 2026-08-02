package com.cbg.travel.service;

import com.cbg.travel.entity.Notification;
import com.cbg.travel.repository.NotificationRepository;
import com.cbg.travel.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SseService sseService;

    public void sendNotification(Long userId, String type, String message) {
        // 1. Persist the in-app notification
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .message(message)
                .readStatus(false)
                .createdAt(LocalDateTime.now())
                .build();
        Notification saved = notificationRepository.save(notification);

        // 2. Push real-time via SSE
        String jsonPayload = String.format(
                "{\"id\":%d,\"type\":\"%s\",\"message\":\"%s\",\"readStatus\":false,\"createdAt\":\"%s\"}",
                saved.getId(), type, message.replace("\"", "\\\""), saved.getCreatedAt().toString()
        );
        sseService.pushEvent(userId, "NOTIFICATION", jsonPayload);

        // 3. Log external channel mock
        userRepository.findById(userId).ifPresent(user -> {
            log.info("[REAL-TIME SSE] Pushed notification to user {} (ID: {})", user.getName(), userId);
            log.info("[SMS SENT] to {} (Phone: {}): {}", user.getName(), user.getPhone(), message);
            log.info("[EMAIL SENT] to {} (Email: {}): {}", user.getName(), user.getEmail(), message);
        });
    }
}
