package com.flood_resilience.backend.event;

public record RealtimeEvent(
        String type,
        String message
) {
}
