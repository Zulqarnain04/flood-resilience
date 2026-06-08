package com.flood_resilience.backend.controller;

import com.flood_resilience.backend.common.dto.ApiResponse;
import com.flood_resilience.backend.common.dto.PageResponse;
import com.flood_resilience.backend.dto.request.CreateResourceRequest;
import com.flood_resilience.backend.dto.response.ResourceResponse;
import com.flood_resilience.backend.entity.Resource;
import com.flood_resilience.backend.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(
            ResourceService resourceService
    ) {
        this.resourceService = resourceService;
    }

    @PostMapping
    public ApiResponse<ResourceResponse> create(
            @Valid @RequestBody CreateResourceRequest request
    ) {

        Resource saved = resourceService.create(request);

        return ApiResponse.success(
                "Resource created successfully",
                ResourceResponse.from(saved)
        );
    }

    @GetMapping
    public ApiResponse<PageResponse<ResourceResponse>> getAll(
            @PageableDefault(size = 20) Pageable pageable
    ) {

        PageResponse<ResourceResponse> response =
                PageResponse.from(
                        resourceService.findAll(pageable)
                                .map(ResourceResponse::from)
                );

        return ApiResponse.success(
                "Resources retrieved successfully",
                response
        );
    }

    @GetMapping("/available")
    public ApiResponse<PageResponse<ResourceResponse>> getAvailable(
            @PageableDefault(size = 20) Pageable pageable
    ) {

        PageResponse<ResourceResponse> response =
                PageResponse.from(
                        resourceService.findAvailable(pageable)
                                .map(ResourceResponse::from)
                );

        return ApiResponse.success(
                "Available resources retrieved successfully",
                response
        );
    }
}
