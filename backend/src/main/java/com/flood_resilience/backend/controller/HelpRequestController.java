package com.flood_resilience.backend.controller;

import com.flood_resilience.backend.ai.AiTriageClient;
import com.flood_resilience.backend.common.dto.ApiResponse;
import com.flood_resilience.backend.common.dto.PageResponse;
import com.flood_resilience.backend.dto.request.CreateHelpRequestRequest;
import com.flood_resilience.backend.dto.response.HelpRequestResponse;
import com.flood_resilience.backend.dto.response.TriageResult;
import com.flood_resilience.backend.entity.HelpRequest;
import com.flood_resilience.backend.service.HelpRequestService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/requests")
public class HelpRequestController {

    private final AiTriageClient aiTriageClient;
    private final HelpRequestService helpRequestService;

    public HelpRequestController(
            AiTriageClient aiTriageClient,
            HelpRequestService helpRequestService
    ) {
        this.aiTriageClient = aiTriageClient;
        this.helpRequestService = helpRequestService;
    }

    @PostMapping
    public ApiResponse<HelpRequestResponse> createRequest(
            @Valid @RequestBody CreateHelpRequestRequest request
    ) {

        HelpRequest existing =
                helpRequestService.findByClientRequestId(
                        request.clientRequestId()
                ).orElse(null);

        if (existing != null) {
            return ApiResponse.success(
                    "Help request already exists",
                    HelpRequestResponse.from(existing)
            );
        }

        TriageResult triageResult =
                aiTriageClient.triage(request.message());

        HelpRequest saved =
                helpRequestService.save(
                        request.clientRequestId(),
                        request.message(),
                        request.latitude(),
                        request.longitude(),
                        triageResult
                );

        return ApiResponse.success(
                "Help request created successfully",
                HelpRequestResponse.from(saved)
        );
    }

    @GetMapping
    public ApiResponse<PageResponse<HelpRequestResponse>> getAllRequests(
            @PageableDefault(size = 20, sort = {"urgencyScore", "createdAt"}, direction = Sort.Direction.DESC)
            Pageable pageable
    ) {

        PageResponse<HelpRequestResponse> response =
                PageResponse.from(
                        helpRequestService.findAll(pageable)
                                .map(HelpRequestResponse::from)
                );

        return ApiResponse.success(
                "Requests retrieved successfully",
                response
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<HelpRequestResponse> getRequestById(
            @PathVariable Long id
    ) {

        HelpRequest request = helpRequestService.findById(id);

        return ApiResponse.success(
                "Request retrieved successfully",
                HelpRequestResponse.from(request)
        );
    }
}
