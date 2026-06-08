package com.flood_resilience.backend.controller;

import com.flood_resilience.backend.common.dto.ApiResponse;
import com.flood_resilience.backend.dto.response.DangerZoneResponse;
import com.flood_resilience.backend.repository.DangerZoneRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
public class ZoneController {

    private final DangerZoneRepository dangerZoneRepository;

    public ZoneController(
            DangerZoneRepository dangerZoneRepository
    ) {
        this.dangerZoneRepository = dangerZoneRepository;
    }

    @GetMapping
    public ApiResponse<List<DangerZoneResponse>> getZones() {

        List<DangerZoneResponse> zones =
                dangerZoneRepository.findAll()
                        .stream()
                        .map(DangerZoneResponse::from)
                        .toList();

        return ApiResponse.success(
                "Danger zones retrieved successfully",
                zones
        );
    }
}
