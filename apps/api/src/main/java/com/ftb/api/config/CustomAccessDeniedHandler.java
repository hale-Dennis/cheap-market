package com.ftb.api.config;

import java.io.IOException;
import org.springframework.http.HttpStatus;
import com.ftb.api.dto.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.HttpServletResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.access.AccessDeniedException;


@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
            throws IOException {

        ApiResponse<Object> apiResponse = ApiResponse.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .message("You do not have permission to access this resource.")
                .build();

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json");
        new ObjectMapper().writeValue(response.getOutputStream(), apiResponse);
    }
}
