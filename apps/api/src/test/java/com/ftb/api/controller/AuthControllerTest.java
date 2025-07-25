package com.ftb.api.controller;

import com.ftb.api.dto.request.RegisterRequest;
import org.mockito.Mock;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.http.MediaType;
import com.ftb.api.dto.response.LoginResponse;
import com.ftb.api.dto.request.LoginRequest;
import static org.mockito.ArgumentMatchers.any;
import com.ftb.api.service.AuthenticationService;
import com.ftb.api.config.JwtAuthenticationFilter;
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

    @Mock
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        AuthController authController = new AuthController(authenticationService);
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .build();
    }

    @Test
    void login_WithValidCredentials_ShouldReturn200AndToken() throws Exception {
        LoginRequest request = new LoginRequest("admin@test.com", "password");
        LoginResponse jwtResponse = new LoginResponse("mock.jwt.token");

        when(authenticationService.login(any(LoginRequest.class))).thenReturn(jwtResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Admin login successful"))
                .andExpect(jsonPath("$.data.token").value("mock.jwt.token"));
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
    void register_ValidRequest_ShouldReturn201Created() throws Exception {
        // Given
        RegisterRequest request = new RegisterRequest("New Buyer", "buyer@test.com", "Password123", "Test Region");
        when(authenticationService.registerBuyer(any())).thenReturn(new LoginResponse("new.jwt.token"));

        // When & Then
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.token").value("new.jwt.token"));
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
}