package com.ftb.api.controller;

import com.ftb.api.util.ResponseHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import com.ftb.api.dto.request.LoginRequest;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.dto.response.JwtResponse;
import com.ftb.api.dto.request.RegisterRequest;
import org.springframework.http.ResponseEntity;
import com.ftb.api.service.AuthenticationService;
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
        return ResponseHandler.successResponse("Login successful", HttpStatus.OK, jwtResponse);
    }

    /**
     * Registers a new user with the 'BUYER' role.
     * @param request The registration details containing name, email, password, and region.
     * @return A ResponseEntity containing a JWT for the new user upon successful registration.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<JwtResponse>> register(@Valid @RequestBody RegisterRequest request) {

        JwtResponse jwtResponse = authenticationService.registerBuyer(request);
        return ResponseHandler.successResponse("Buyer registered successfully.", HttpStatus.CREATED, jwtResponse);
    }
}