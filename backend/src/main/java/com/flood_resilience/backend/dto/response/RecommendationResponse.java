package com.flood_resilience.backend.dto.response;

public record RecommendationResponse(

        Long resourceId,

        String resourceName,

        String resourceType,

        Double distanceKm,

        Integer matchScore

) {
}