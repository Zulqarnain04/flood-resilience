package com.flood_resilience.backend.controller;

import com.flood_resilience.backend.ai.AiTriageClient;
import com.flood_resilience.backend.common.dto.ApiResponse;
import com.flood_resilience.backend.dto.request.TestTriageRequest;
import com.flood_resilience.backend.dto.response.TestTriageResponse;
import com.flood_resilience.backend.dto.response.TriageResult;
import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test-triage")
@Profile({"dev", "demo"})
public class TestTriageController {

    private final AiTriageClient aiTriageClient;

    public TestTriageController(
            AiTriageClient aiTriageClient
    ) {
        this.aiTriageClient = aiTriageClient;
    }

    @PostMapping
    public ApiResponse<TestTriageResponse> testTriage(
            @Valid @RequestBody TestTriageRequest request
    ) {

        TriageResult triageResult =
                aiTriageClient.triage(
                        request.message()
                );

        return ApiResponse.success(
                "Triage completed",
                new TestTriageResponse(
                        triageResult
                )
        );
    }
}