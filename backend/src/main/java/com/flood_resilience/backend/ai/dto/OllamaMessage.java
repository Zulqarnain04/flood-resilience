package com.flood_resilience.backend.ai.dto;

public record OllamaMessage(
        String role,
        String content
) {
}