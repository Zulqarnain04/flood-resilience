package com.flood_resilience.backend.service;

import com.flood_resilience.backend.dto.response.LiveEventResponse;
import com.flood_resilience.backend.event.RealtimeEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;

@Service
public class RealtimeEventService {

    private final ApplicationEventPublisher eventPublisher;
    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeEventService(
            ApplicationEventPublisher eventPublisher,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.eventPublisher = eventPublisher;
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(
            String eventType,
            String message
    ) {

        eventPublisher.publishEvent(
                new RealtimeEvent(eventType, message)
        );
    }

    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT,
            fallbackExecution = true
    )
    public void forwardToStomp(RealtimeEvent event) {

        messagingTemplate.convertAndSend(
                "/topic/events",
                new LiveEventResponse(
                        event.type(),
                        event.message(),
                        Instant.now()
                )
        );
    }
}
