package com.flood_resilience.backend.ai.dto;

public record OllamaChatResponse(
        String model,
        OllamaMessage message,
        boolean done
) {
}