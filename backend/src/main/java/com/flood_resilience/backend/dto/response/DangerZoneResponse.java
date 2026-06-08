package com.flood_resilience.backend.dto.response;

import com.flood_resilience.backend.entity.DangerZone;

public record DangerZoneResponse(

        Long id,

        String name,

        Double centerLatitude,

        Double centerLongitude,

        Double radiusMeters,

        Integer riskWeight,

        String cause

) {

    public static DangerZoneResponse from(DangerZone zone) {
        return new DangerZoneResponse(
                zone.getId(),
                zone.getName(),
                zone.getCenterLatitude(),
                zone.getCenterLongitude(),
                zone.getRadiusMeters(),
                zone.getRiskWeight(),
                zone.getCause().name()
        );
    }
}
