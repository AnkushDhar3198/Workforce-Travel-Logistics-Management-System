package com.cbg.travel.service;

import com.cbg.travel.entity.Notification;
import com.cbg.travel.entity.User;
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

    public void sendNotification(Long userId, String type, String message) {
        // 1. Persist the in-app notification
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .message(message)
                .readStatus(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);

        // 2. Mock external channels
        userRepository.findById(userId).ifPresent(user -> {
            log.info("[SMS SENT] to {} (Phone: {}): {}", user.getName(), user.getPhone(), message);
            log.info("[EMAIL SENT] to {} (Email: {}): {}", user.getName(), user.getEmail(), message);
            System.out.println("[SMS ALERT] to " + user.getPhone() + ": " + message);
            System.out.println("[EMAIL ALERT] to " + user.getEmail() + ": " + message);
        });
    }
}
