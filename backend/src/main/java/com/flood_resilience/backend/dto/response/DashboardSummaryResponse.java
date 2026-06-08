package com.flood_resilience.backend.dto.response;

public record DashboardSummaryResponse(

        long totalRequests,
        long pendingRequests,
        long assignedRequests,
        long inProgressRequests,
        long resolvedRequests,

        long totalResources,
        long availableResources,
        long assignedResources,

        long totalAssignments,
        long activeAssignments

) {
}