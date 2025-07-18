package com.ftb.api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        ApiResponse<Object> apiResponse = ApiResponse.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .message("Authentication is required to access this resource.")
                .build();

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        new ObjectMapper().writeValue(response.getOutputStream(), apiResponse);
    }
}
