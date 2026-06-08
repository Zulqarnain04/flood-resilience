package com.flood_resilience.backend.controller;

import com.flood_resilience.backend.common.dto.ApiResponse;
import com.flood_resilience.backend.service.DemoService;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo")
@Profile({"dev", "demo"})
public class DemoController {

    private final DemoService demoService;

    public DemoController(
            DemoService demoService
    ) {
        this.demoService = demoService;
    }

    @PostMapping("/generate")
    public ApiResponse<String> generate() {

        demoService.generateDemoData();

        return ApiResponse.success(
                "Demo data generated successfully",
                "OK"
        );
    }
}