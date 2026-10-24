package com.ftb.api.service;

import java.util.List;
import java.util.UUID;
import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import com.ftb.api.model.Notification;
import lombok.RequiredArgsConstructor;
import com.ftb.api.model.NotificationType;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import com.ftb.api.repository.NotificationRepository;
import com.ftb.api.dto.response.NotificationResponse;
import com.ftb.api.exception.ResourceNotFoundException;
import com.ftb.api.dto.response.AdminNotificationsResponse;
import org.springframework.transaction.annotation.Transactional;


/**
 * Notifies System Admins. Notifications are stored (and shown on the admin dashboard) in the same
 * transaction as the event, so they can't be lost; email/SMS delivery can be added as a worker later.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminNotifier {

    private static final int RECENT_LIMIT = 20;

    private final NotificationRepository notificationRepository;

    @Transactional
    public void notifyNewOrder(UUID orderId, String message) {
        notificationRepository.save(Notification.builder()
                .type(NotificationType.NEW_ORDER)
                .orderId(orderId)
                .message(message)
                .build());
        log.info("Admin notification: {}", message);
    }

    /** The most recent notifications and how many are unread. */
    @Transactional(readOnly = true)
    public AdminNotificationsResponse recent() {
        List<NotificationResponse> notifications = notificationRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, RECENT_LIMIT))
                .map(NotificationResponse::from)
                .getContent();
        return new AdminNotificationsResponse(notificationRepository.countByReadAtIsNull(), notifications);
    }

    @Transactional
    public void markRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }
    }

    @Transactional
    public void markAllRead() {
        notificationRepository.markAllRead(Instant.now());
    }
}
