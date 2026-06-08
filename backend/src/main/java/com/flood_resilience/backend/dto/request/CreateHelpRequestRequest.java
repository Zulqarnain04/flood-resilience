package com.flood_resilience.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateHelpRequestRequest(

        @NotBlank
        String clientRequestId,

        @NotBlank
        String message,

        @NotNull
        @Min(-90)
        @Max(90)
        Double latitude,

        @NotNull
        @Min(-180)
        @Max(180)
        Double longitude

) {
}