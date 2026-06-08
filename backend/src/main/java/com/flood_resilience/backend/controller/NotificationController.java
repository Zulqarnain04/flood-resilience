package com.flood_resilience.backend.controller;

import com.flood_resilience.backend.common.dto.ApiResponse;
import com.flood_resilience.backend.common.dto.PageResponse;
import com.flood_resilience.backend.dto.response.NotificationResponse;
import com.flood_resilience.backend.service.NotificationService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService
    ) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<PageResponse<NotificationResponse>> getAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {

        PageResponse<NotificationResponse> response =
                PageResponse.from(
                        notificationService.findAll(pageable)
                                .map(NotificationResponse::from)
                );

        return ApiResponse.success(
                "Notifications retrieved successfully",
                response
        );
    }

    @PostMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markRead(
            @PathVariable Long id
    ) {

        return ApiResponse.success(
                "Notification marked as read",
                NotificationResponse.from(
                        notificationService.markRead(id)
                )
        );
    }
}
