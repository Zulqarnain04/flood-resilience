package com.flood_resilience.backend.dto.response;

import java.time.Instant;

public record LiveEventResponse(

        String eventType,

        String message,

        Instant timestamp

) {
}