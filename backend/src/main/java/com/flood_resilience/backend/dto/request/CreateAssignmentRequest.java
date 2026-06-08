package com.flood_resilience.backend.dto.request;

import jakarta.validation.constraints.NotNull;

public record CreateAssignmentRequest(

        @NotNull
        Long helpRequestId,

        @NotNull
        Long resourceId

) {
}