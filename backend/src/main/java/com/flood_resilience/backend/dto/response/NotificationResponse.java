package com.flood_resilience.backend.dto.response;

import com.flood_resilience.backend.entity.Notification;
import com.flood_resilience.backend.entity.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String message,
        NotificationType type,
        Boolean isRead,
        Instant createdAt
) {

    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getMessage(),
                notification.getType(),
                notification.getIsRead(),
                notification.getCreatedAt()
        );
    }
}
