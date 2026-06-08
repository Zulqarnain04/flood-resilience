package com.flood_resilience.backend.dto.response;

import com.flood_resilience.backend.entity.HelpRequest;
import com.flood_resilience.backend.entity.RequestStatus;
import com.flood_resilience.backend.entity.UrgencyLevel;

import java.time.Instant;
import java.util.List;

public record HelpRequestResponse(
        Long id,
        String message,
        String summary,
        String category,
        Integer dangerScore,
        Integer vulnerabilityScore,
        Integer locationRisk,
        Double urgencyScore,
        UrgencyLevel urgencyLevel,
        Integer peopleCount,
        String detectedLanguage,
        List<String> needs,
        Double latitude,
        Double longitude,
        RequestStatus status,
        Instant createdAt
) {

    public static HelpRequestResponse from(HelpRequest request) {
        return new HelpRequestResponse(
                request.getId(),
                request.getMessage(),
                request.getSummary(),
                request.getCategory() == null ? null : request.getCategory().name(),
                request.getDangerScore(),
                request.getVulnerabilityScore(),
                request.getLocationRisk(),
                request.getUrgencyScore(),
                request.getUrgencyLevel(),
                request.getPeopleCount(),
                request.getDetectedLanguage(),
                request.getNeeds(),
                request.getLatitude(),
                request.getLongitude(),
                request.getStatus(),
                request.getCreatedAt()
        );
    }
}
