package com.flood_resilience.backend.dto.response;

public record MapPinResponse(

        Long id,

        String pinType,

        String category,

        String status,

        Double urgencyScore,

        String urgencyLevel,

        Integer availableCapacity,

        Double latitude,

        Double longitude

) {
}
