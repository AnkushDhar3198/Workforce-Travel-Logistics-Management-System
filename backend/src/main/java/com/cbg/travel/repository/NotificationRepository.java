package com.cbg.travel.repository;

import com.cbg.travel.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndReadStatusOrderByCreatedAtDesc(Long userId, Boolean readStatus);
}
