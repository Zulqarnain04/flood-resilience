package com.flood_resilience.backend.ai.dto;

import java.util.List;

public record OllamaChatRequest(
        String model,
        boolean stream,
        String format,
        List<OllamaMessage> messages
) {
}