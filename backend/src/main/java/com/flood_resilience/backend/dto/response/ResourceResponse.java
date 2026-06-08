package com.flood_resilience.backend.dto.response;

import com.flood_resilience.backend.entity.Resource;
import com.flood_resilience.backend.entity.ResourceStatus;
import com.flood_resilience.backend.entity.ResourceType;

import java.time.Instant;

public record ResourceResponse(
        Long id,
        String name,
        ResourceType type,
        ResourceStatus status,
        Double latitude,
        Double longitude,
        Integer maxCapacity,
        Integer availableCapacity,
        String phoneNumber,
        Instant createdAt
) {

    public static ResourceResponse from(Resource resource) {
        return new ResourceResponse(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getStatus(),
                resource.getLatitude(),
                resource.getLongitude(),
                resource.getMaxCapacity(),
                resource.getAvailableCapacity(),
                resource.getPhoneNumber(),
                resource.getCreatedAt()
        );
    }
}
