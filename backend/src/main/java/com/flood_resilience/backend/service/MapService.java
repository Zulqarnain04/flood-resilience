package com.flood_resilience.backend.service;

import com.flood_resilience.backend.dto.response.MapPinResponse;
import com.flood_resilience.backend.dto.response.MapPinsResponse;
import com.flood_resilience.backend.entity.HelpRequest;
import com.flood_resilience.backend.entity.Resource;
import com.flood_resilience.backend.repository.HelpRequestRepository;
import com.flood_resilience.backend.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MapService {

    private final HelpRequestRepository helpRequestRepository;
    private final ResourceRepository resourceRepository;

    public MapService(
            HelpRequestRepository helpRequestRepository,
            ResourceRepository resourceRepository
    ) {
        this.helpRequestRepository =
                helpRequestRepository;

        this.resourceRepository =
                resourceRepository;
    }

    public MapPinsResponse getPins() {

        List<MapPinResponse> requests =
                helpRequestRepository.findAll()
                        .stream()
                        .map(this::toRequestPin)
                        .toList();

        List<MapPinResponse> resources =
                resourceRepository.findAll()
                        .stream()
                        .map(this::toResourcePin)
                        .toList();

        return new MapPinsResponse(
                requests,
                resources
        );
    }

    private MapPinResponse toRequestPin(
            HelpRequest request
    ) {

        return new MapPinResponse(
                request.getId(),
                "REQUEST",
                request.getCategory() == null ? null : request.getCategory().name(),
                request.getStatus().name(),
                request.getUrgencyScore(),
                request.getUrgencyLevel() == null
                        ? null
                        : request.getUrgencyLevel().name(),
                null,
                request.getLatitude(),
                request.getLongitude()
        );
    }

    private MapPinResponse toResourcePin(
            Resource resource
    ) {

        return new MapPinResponse(
                resource.getId(),
                "RESOURCE",
                resource.getType().name(),
                resource.getStatus().name(),
                null,
                null,
                resource.getAvailableCapacity(),
                resource.getLatitude(),
                resource.getLongitude()
        );
    }
}