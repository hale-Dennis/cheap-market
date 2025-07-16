package com.ftb.api.service;

import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.dto.request.LoginRequest;
import com.ftb.api.dto.response.JwtResponse;
import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.authentication.BadCredentialsException;


@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authenticationService, "adminUsername", "admin@test.com");
        ReflectionTestUtils.setField(authenticationService, "adminPassword", "password123");
    }

    @Test
    void login_WithValidCredentials_ShouldReturnJwtResponse() {
        LoginRequest request = new LoginRequest("admin@test.com", "password123");
        String expectedToken = "mock.jwt.token";
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn(expectedToken);

        JwtResponse response = authenticationService.login(request);

        assertNotNull(response);
        assertEquals(expectedToken, response.getToken());
    }

    @Test
    void login_WithInvalidPassword_ShouldThrowBadCredentialsException() {
        LoginRequest request = new LoginRequest("admin@test.com", "wrongpassword");

        assertThrows(BadCredentialsException.class, () -> {
            authenticationService.login(request);
        });
    }

    @Test
    void login_WithInvalidUsername_ShouldThrowBadCredentialsException() {
        LoginRequest request = new LoginRequest("wrong@test.com", "password123");

        assertThrows(BadCredentialsException.class, () -> {
            authenticationService.login(request);
        });
    }
}