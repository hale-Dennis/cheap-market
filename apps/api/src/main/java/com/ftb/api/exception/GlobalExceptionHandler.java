package com.ftb.api.exception;

import java.util.stream.Collectors;

import com.ftb.api.util.ResponseHandler;
import io.jsonwebtoken.ExpiredJwtException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.security.authentication.BadCredentialsException;


@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentialsException(BadCredentialsException ex) {
        return ResponseHandler.errorResponse("Invalid email or password", HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        return ResponseHandler.errorResponse("Validation failed: " + errors, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Object>> handleConflictException(ConflictException ex) {
        return ResponseHandler.errorResponse(ex.getMessage(), HttpStatus.CONFLICT);
    }

    /**
     * Handles exceptions for resources that could not be found.
     * @param ex The caught ResourceNotFoundException.
     * @return A ResponseEntity with a 404 Not Found status and a clear error message.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return ResponseHandler.errorResponse(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleConstraintViolationException(ConstraintViolationException ex) {
        String errors = ex.getConstraintViolations().stream()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .collect(Collectors.joining(", "));

        return ResponseHandler.errorResponse("Validation failed: " + errors, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        return ResponseHandler.errorResponse("Database constraint violation: " + ex.getMostSpecificCause().getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseHandler.errorResponse("You do not have permission to access this resource.", HttpStatus.FORBIDDEN);
    }

    /**
     * Handles errors caused by a malformed request body (e.g., invalid date format).
     * @param ex The caught HttpMessageNotReadableException.
     * @return A ResponseEntity with a 400 Bad Request status.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        return ResponseHandler.errorResponse("Invalid request body. Please check the data format (e.g., dates should be 'YYYY-MM-DD').", HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles errors caused by missing required request parameters.
     * @param ex The caught MissingServletRequestParameterException.
     * @return A ResponseEntity with a 400 Bad Request status.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Object>> handleMissingServletRequestParameter(MissingServletRequestParameterException ex) {
        String message = "Required request parameter '" + ex.getParameterName() + "' is not present.";
        return ResponseHandler.errorResponse(message, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<ApiResponse<Object>> handleExpiredJwtException(ExpiredJwtException ex) {
        return ResponseHandler.errorResponse("Please log in again.", HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(TokenRefreshException.class)
    public ResponseEntity<ApiResponse<Object>> handleTokenRefreshException(TokenRefreshException ex) {
        return ResponseHandler.errorResponse(ex.getMessage(), HttpStatus.FORBIDDEN);
    }


    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        log.error("An unexpected internal server error occurred: ", ex);
        return ResponseHandler.errorResponse("An unexpected internal server error occurred.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
