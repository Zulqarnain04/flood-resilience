package com.flood_resilience.backend.dto.response;

import com.flood_resilience.backend.entity.AssignmentStatus;

import java.time.Instant;

public record AssignmentResponse(

        Long id,

        Long helpRequestId,

        Long resourceId,

        AssignmentStatus status,

        Instant assignedAt,

        Instant acceptedAt,

        Instant completedAt

) {
}