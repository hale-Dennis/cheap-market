package com.ftb.api.util;

import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public final class ResponseHandler {

    private ResponseHandler() {
    }

    public static <T> ResponseEntity<ApiResponse<T>> generateResponse(String message, HttpStatus status, T responseData) {
        ApiResponse<T> response = ApiResponse.<T>builder()
                .status(status.value())
                .message(message)
                .data(responseData)
                .build();
        return new ResponseEntity<>(response, status);
    }

    /**
     * Generates a standardized error response.
     * @param message The error message.
     * @param status The HTTP status.
     * @return A ResponseEntity containing the formatted error.
     */
    public static ResponseEntity<ApiResponse<Object>> generateErrorResponse(String message, HttpStatus status) {
        ApiResponse<Object> response = ApiResponse.builder()
                .status(status.value())
                .message(message)
                .data(null)
                .build();
        return new ResponseEntity<>(response, status);
    }
}