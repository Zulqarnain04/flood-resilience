package com.flood_resilience.backend.controller;

import com.flood_resilience.backend.common.dto.ApiResponse;
import com.flood_resilience.backend.dto.response.CategoryAnalyticsResponse;
import com.flood_resilience.backend.dto.response.DashboardSummaryResponse;
import com.flood_resilience.backend.dto.response.HelpRequestResponse;
import com.flood_resilience.backend.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(
            DashboardService dashboardService
    ) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ApiResponse<DashboardSummaryResponse> summary() {

        return ApiResponse.success(
                "Dashboard summary retrieved",
                dashboardService.getSummary()
        );
    }

    @GetMapping("/categories")
    public ApiResponse<CategoryAnalyticsResponse> categories() {

        return ApiResponse.success(
                "Category analytics retrieved",
                dashboardService.getCategories()
        );
    }

    @GetMapping("/high-priority")
    public ApiResponse<List<HelpRequestResponse>> highPriority() {

        List<HelpRequestResponse> response =
                dashboardService.getHighPriorityRequests()
                        .stream()
                        .map(HelpRequestResponse::from)
                        .toList();

        return ApiResponse.success(
                "High priority requests retrieved",
                response
        );
    }
}
