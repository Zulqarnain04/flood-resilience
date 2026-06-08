package com.flood_resilience.backend.service;

import com.flood_resilience.backend.common.exception.NotFoundException;
import com.flood_resilience.backend.dto.response.RecommendationResponse;
import com.flood_resilience.backend.entity.HelpRequest;
import com.flood_resilience.backend.entity.RequestCategory;
import com.flood_resilience.backend.entity.Resource;
import com.flood_resilience.backend.entity.ResourceStatus;
import com.flood_resilience.backend.entity.ResourceType;
import com.flood_resilience.backend.repository.HelpRequestRepository;
import com.flood_resilience.backend.repository.ResourceRepository;
import com.flood_resilience.backend.util.GeoUtils;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class RecommendationService {

    private final HelpRequestRepository helpRequestRepository;
    private final ResourceRepository resourceRepository;

    public RecommendationService(
            HelpRequestRepository helpRequestRepository,
            ResourceRepository resourceRepository
    ) {
        this.helpRequestRepository =
                helpRequestRepository;

        this.resourceRepository =
                resourceRepository;
    }

    public List<RecommendationResponse> recommend(
            Long requestId
    ) {

        HelpRequest request =
                helpRequestRepository.findById(
                        requestId
                ).orElseThrow(
                        () -> new NotFoundException(
                                "Help request not found: " + requestId
                        )
                );

        return resourceRepository.findByStatus(
                        ResourceStatus.AVAILABLE
                )
                .stream()
                .filter(resource ->
                        resource.getAvailableCapacity() > 0
                )
                .map(resource -> {

                    double distance =
                            GeoUtils.distanceKm(
                                    request.getLatitude(),
                                    request.getLongitude(),
                                    resource.getLatitude(),
                                    resource.getLongitude()
                            );

                    int compatibility =
                            compatibilityScore(
                                    request.getCategory(),
                                    resource.getType()
                            );

                    int proximity =
                            proximityScore(distance);

                    int urgency =
                            urgencyScore(request.getDangerScore());

                    int matchScore =
                            (int) Math.round(
                                    compatibility * 0.5
                                            + proximity * 0.3
                                            + urgency * 0.2
                            );

                    return new RecommendationResponse(
                            resource.getId(),
                            resource.getName(),
                            resource.getType().name(),
                            Math.round(distance * 100.0) / 100.0,
                            matchScore
                    );
                })
                .sorted(
                        Comparator.comparingInt(
                                RecommendationResponse::matchScore
                        ).reversed()
                )
                .limit(3)
                .toList();
    }

    private int proximityScore(
            double distance
    ) {

        if (distance <= 1) return 100;
        if (distance <= 3) return 80;
        if (distance <= 5) return 60;
        if (distance <= 10) return 40;

        return 20;
    }

    private int urgencyScore(
            Integer dangerScore
    ) {
        if (dangerScore == null) return 0;
        return Math.max(0, Math.min(100, dangerScore * 10));
    }

    private int compatibilityScore(
            RequestCategory category,
            ResourceType type
    ) {

        return switch (category) {

            case RESCUE -> switch (type) {
                case BOAT -> 100;
                case VOLUNTEER -> 90;
                default -> 20;
            };

            case MEDICAL -> switch (type) {
                case MEDICAL_SUPPLY -> 100;
                case VOLUNTEER -> 85;
                case BOAT -> 70;
                default -> 20;
            };

            case SUPPLIES -> switch (type) {
                case MEDICAL_SUPPLY -> 100;
                case VOLUNTEER -> 70;
                default -> 40;
            };

            case SHELTER -> switch (type) {
                case SHELTER -> 100;
                default -> 30;
            };

            case OTHER -> 50;
        };
    }
}