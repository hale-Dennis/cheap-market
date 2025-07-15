package com.ftb.api.controller;

import com.ftb.api.dto.request.LoginRequest;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.dto.response.JwtResponse;
import com.ftb.api.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> login(@RequestBody @Valid LoginRequest request) {
        JwtResponse jwtResponse = authenticationService.login(request);

        ApiResponse<JwtResponse> response = ApiResponse.<JwtResponse>builder()
                .status(200)
                .message("Admin login successful")
                .data(jwtResponse)
                .build();

        return ResponseEntity.ok(response);
    }
}