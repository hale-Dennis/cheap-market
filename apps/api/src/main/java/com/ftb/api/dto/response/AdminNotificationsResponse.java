package com.ftb.api.dto.response;

import java.util.List;


/** Recent notifications, newest first, with the total number still unread. */
public record AdminNotificationsResponse(long unreadCount, List<NotificationResponse> notifications) {
}
