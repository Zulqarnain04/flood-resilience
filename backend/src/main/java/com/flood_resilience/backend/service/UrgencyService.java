package com.flood_resilience.backend.service;

import com.flood_resilience.backend.entity.DangerZone;
import com.flood_resilience.backend.entity.UrgencyLevel;
import com.flood_resilience.backend.util.GeoUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UrgencyService {

    public int computeLocationRisk(
            double latitude,
            double longitude,
            List<DangerZone> zones
    ) {

        int max = 0;

        for (DangerZone zone : zones) {

            double distanceMeters =
                    GeoUtils.distanceKm(
                            latitude,
                            longitude,
                            zone.getCenterLatitude(),
                            zone.getCenterLongitude()
                    ) * 1000.0;

            if (distanceMeters <= zone.getRadiusMeters()) {
                max = Math.max(max, zone.getRiskWeight());
            }
        }

        return max;
    }

    public double computeUrgency(
            int dangerScore,
            int locationRisk,
            int vulnerabilityScore
    ) {

        return (dangerScore * 0.5)
                + (locationRisk * 0.3)
                + (vulnerabilityScore * 0.2);
    }

    public UrgencyLevel toLevel(double urgencyScore) {

        if (urgencyScore >= 8.0) return UrgencyLevel.CRITICAL;
        if (urgencyScore >= 5.5) return UrgencyLevel.HIGH;
        if (urgencyScore >= 3.0) return UrgencyLevel.MODERATE;

        return UrgencyLevel.LOW;
    }
}
