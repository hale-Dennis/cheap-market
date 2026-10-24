package com.ftb.api.controller;

import com.ftb.api.dto.request.RegisterRequest;
import com.ftb.api.dto.request.RefreshTokenRequest;
import com.ftb.api.exception.TokenRefreshException;
import org.mockito.Mock;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.http.MediaType;
import com.ftb.api.dto.response.LoginResponse;
import com.ftb.api.dto.request.LoginRequest;
import static org.mockito.ArgumentMatchers.any;
import com.ftb.api.service.AuthenticationService;
import com.ftb.api.exception.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.security.authentication.BadCredentialsException;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        AuthController authController = new AuthController(authenticationService);
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void login_WithValidCredentials_ShouldReturn200AndToken() throws Exception {
        LoginRequest request = new LoginRequest("admin@test.com", "password");
        LoginResponse jwtResponse = new LoginResponse("mock.jwt.token", "mock-refresh-token");

        when(authenticationService.login(any(LoginRequest.class))).thenReturn(jwtResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.data.accessToken").value("mock.jwt.token"))
                .andExpect(jsonPath("$.data.refreshToken").value("mock-refresh-token"));
    }

    @Test
    void login_WithInvalidCredentials_ShouldReturn401() throws Exception {
        LoginRequest request = new LoginRequest("admin@test.com", "wrongpassword");

        when(authenticationService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void login_WithBlankCredentials_ShouldReturn400() throws Exception {
        LoginRequest request = new LoginRequest("", "");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        verifyNoInteractions(authenticationService);
    }

    @Test
    void register_ValidRequest_ShouldReturn201Created() throws Exception {
        // Given
        RegisterRequest request = new RegisterRequest("New Buyer", "buyer@test.com", "Password123", "Test Region");
        when(authenticationService.registerBuyer(any())).thenReturn(new LoginResponse("new.jwt.token", "new-refresh-token"));

        // When & Then
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.accessToken").value("new.jwt.token"));
    }

    @Test
    void register_WeakPassword_ShouldReturn400BadRequest() throws Exception {
        // Given
        RegisterRequest request = new RegisterRequest("New Buyer", "buyer@test.com", "weak", "Test Region");

        // When & Then
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refresh_WithValidToken_ShouldReturn200AndNewAccessToken() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("refresh-token");
        when(authenticationService.refreshToken(any(RefreshTokenRequest.class)))
                .thenReturn(new LoginResponse("fresh.jwt.token", "refresh-token"));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("fresh.jwt.token"));
    }

    @Test
    void refresh_WithUnknownToken_ShouldReturn403() throws Exception {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("unknown-token");
        when(authenticationService.refreshToken(any(RefreshTokenRequest.class)))
                .thenThrow(new TokenRefreshException("unknown-token", "Refresh token is not in the database."));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
