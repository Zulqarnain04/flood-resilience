package com.flood_resilience.backend.dto.request;

import com.flood_resilience.backend.entity.ResourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateResourceRequest(

        @NotBlank
        String name,

        @NotNull
        ResourceType type,

        @NotNull
        Double latitude,

        @NotNull
        Double longitude,

        @NotNull
        Integer maxCapacity,

        String phoneNumber

) {
}