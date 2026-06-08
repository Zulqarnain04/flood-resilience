package com.flood_resilience.backend.controller;

import com.flood_resilience.backend.common.dto.ApiResponse;
import com.flood_resilience.backend.dto.request.CreateAssignmentRequest;
import com.flood_resilience.backend.dto.response.AssignmentResponse;
import com.flood_resilience.backend.dto.response.RecommendationResponse;
import com.flood_resilience.backend.entity.Assignment;
import com.flood_resilience.backend.service.AssignmentService;
import com.flood_resilience.backend.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final RecommendationService recommendationService;

    public AssignmentController(
            AssignmentService assignmentService,
            RecommendationService recommendationService
    ) {
        this.assignmentService = assignmentService;
        this.recommendationService = recommendationService;
    }

    @PostMapping
    public ApiResponse<AssignmentResponse> create(
            @Valid @RequestBody CreateAssignmentRequest request
    ) {

        Assignment assignment =
                assignmentService.create(
                        request
                );

        return ApiResponse.success(
                "Assignment created successfully",
                map(assignment)
        );
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<AssignmentResponse> accept(
            @PathVariable Long id
    ) {

        Assignment assignment =
                assignmentService.accept(
                        id
                );

        return ApiResponse.success(
                "Assignment accepted",
                map(assignment)
        );
    }

    @PostMapping("/{id}/reject")
    public ApiResponse<AssignmentResponse> reject(
            @PathVariable Long id
    ) {

        Assignment assignment =
                assignmentService.reject(
                        id
                );

        return ApiResponse.success(
                "Assignment rejected",
                map(assignment)
        );
    }

    @PostMapping("/{id}/complete")
    public ApiResponse<AssignmentResponse> complete(
            @PathVariable Long id
    ) {

        Assignment assignment =
                assignmentService.complete(
                        id
                );

        return ApiResponse.success(
                "Assignment completed",
                map(assignment)
        );
    }

    @GetMapping("/recommend/{requestId}")
    public ApiResponse<List<RecommendationResponse>> recommend(
            @PathVariable Long requestId
    ) {

        return ApiResponse.success(
                "Recommendations generated",
                recommendationService.recommend(
                        requestId
                )
        );
    }

    private AssignmentResponse map(
            Assignment assignment
    ) {

        return new AssignmentResponse(
                assignment.getId(),
                assignment.getHelpRequest().getId(),
                assignment.getResource().getId(),
                assignment.getStatus(),
                assignment.getAssignedAt(),
                assignment.getAcceptedAt(),
                assignment.getCompletedAt()
        );
    }
}