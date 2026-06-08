package com.flood_resilience.backend.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        boolean success,
        String message,
        Map<String, String> fields,
        Instant timestamp
) {

    public static ErrorResponse of(String message) {
        return new ErrorResponse(false, message, null, Instant.now());
    }

    public static ErrorResponse of(String message, Map<String, String> fields) {
        return new ErrorResponse(false, message, fields, Instant.now());
    }
}
