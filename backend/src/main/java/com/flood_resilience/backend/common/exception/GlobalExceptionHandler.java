package com.flood_resilience.backend.common.exception;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            NotFoundException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(ex.getMessage()));
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRule(
            BusinessRuleException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of(ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex
    ) {
        log.warn("Illegal argument: {}", ex.getMessage());

        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.of(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex
    ) {

        Map<String, String> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() == null
                                ? "invalid"
                                : fe.getDefaultMessage(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        log.warn("Validation failed: {}", fieldErrors);

        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.of(
                        "Request validation failed.",
                        fieldErrors
                ));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex
    ) {

        Map<String, String> fieldErrors = ex.getConstraintViolations()
                .stream()
                .collect(Collectors.toMap(
                        v -> v.getPropertyPath().toString(),
                        v -> v.getMessage() == null ? "invalid" : v.getMessage(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        log.warn("Constraint violation: {}", fieldErrors);

        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.of(
                        "Request validation failed.",
                        fieldErrors
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex
    ) {

        log.error("Unhandled exception", ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(
                        "An unexpected error occurred."
                ));
    }
}
