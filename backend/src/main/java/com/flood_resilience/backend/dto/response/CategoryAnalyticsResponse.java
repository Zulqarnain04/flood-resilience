package com.flood_resilience.backend.dto.response;

public record CategoryAnalyticsResponse(

        long medical,

        long rescue,

        long supplies,

        long shelter,

        long other

) {
}