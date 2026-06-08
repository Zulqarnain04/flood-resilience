package com.flood_resilience.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TestTriageRequest(

        @NotBlank(message = "Message is required")
        @Size(
                max = 2000,
                message = "Message must not exceed 2000 characters"
        )
        String message

) {
}