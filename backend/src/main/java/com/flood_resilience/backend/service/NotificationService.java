package com.flood_resilience.backend.service;

import com.flood_resilience.backend.common.exception.NotFoundException;
import com.flood_resilience.backend.entity.Notification;
import com.flood_resilience.backend.entity.NotificationType;
import com.flood_resilience.backend.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository repository;
    private final RealtimeEventService realtimeEventService;

    public NotificationService(
            NotificationRepository repository,
            RealtimeEventService realtimeEventService
    ) {
        this.repository = repository;
        this.realtimeEventService =
                realtimeEventService;
    }

    public Notification create(
            String message,
            NotificationType type
    ) {

        Notification notification =
                new Notification();

        notification.setMessage(
                message
        );

        notification.setType(
                type
        );

        Notification saved =
                repository.save(
                        notification
                );

        realtimeEventService.publish(
                "NOTIFICATION_CREATED",
                message
        );

        return saved;
    }

    public Page<Notification> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public Notification markRead(
            Long id
    ) {

        Notification notification =
                repository.findById(id)
                        .orElseThrow(
                                () -> new NotFoundException(
                                        "Notification not found: " + id
                                )
                        );

        notification.setIsRead(
                true
        );

        return repository.save(
                notification
        );
    }
}