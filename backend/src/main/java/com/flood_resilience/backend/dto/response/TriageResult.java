package com.flood_resilience.backend.dto.response;

import java.util.List;

public record TriageResult(
        String summary,
        String category,
        Integer dangerScore,
        Integer vulnerabilityScore,
        Integer peopleCount,
        String detectedLanguage,
        List<String> needs
) {
}