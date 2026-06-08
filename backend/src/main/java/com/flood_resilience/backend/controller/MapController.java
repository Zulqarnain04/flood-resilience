package com.flood_resilience.backend.controller;

import com.flood_resilience.backend.common.dto.ApiResponse;
import com.flood_resilience.backend.dto.response.MapPinsResponse;
import com.flood_resilience.backend.service.MapService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/map")
public class MapController {

    private final MapService mapService;

    public MapController(
            MapService mapService
    ) {
        this.mapService = mapService;
    }

    @GetMapping("/pins")
    public ApiResponse<MapPinsResponse> getPins() {

        return ApiResponse.success(
                "Map pins retrieved successfully",
                mapService.getPins()
        );
    }
}