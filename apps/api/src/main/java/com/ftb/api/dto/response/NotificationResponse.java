package com.ftb.api.dto.response;

import java.util.UUID;
import java.time.Instant;
import com.ftb.api.model.Notification;
import com.ftb.api.model.NotificationType;


public record NotificationResponse(UUID id, NotificationType type, String message, UUID orderId,
                                   Instant createdAt, boolean read) {

    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(notification.getId(), notification.getType(), notification.getMessage(),
                notification.getOrderId(), notification.getCreatedAt(), notification.getReadAt() != null);
    }
}
