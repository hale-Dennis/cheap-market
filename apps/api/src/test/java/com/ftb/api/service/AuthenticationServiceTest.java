package com.ftb.api.service;

import com.ftb.api.dto.request.RegisterRequest;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.model.User;
import com.ftb.api.repository.UserRepository;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.junit.jupiter.api.Test;

import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.dto.request.LoginRequest;
import com.ftb.api.dto.response.LoginResponse;
import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.authentication.BadCredentialsException;


@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserService userService;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authenticationService, "adminUsername", "admin@test.com");
        ReflectionTestUtils.setField(authenticationService, "adminPassword", "password123");
    }

//    @Test
//    void login_WithValidCredentials_ShouldReturnJwtResponse() {
//        LoginRequest request = new LoginRequest("admin@test.com", "password123");
//        String expectedToken = "mock.jwt.token";
//        when(jwtService.generateToken(any(UserDetails.class))).thenReturn(expectedToken);
//
//        LoginResponse response = authenticationService.login(request);
//
//        assertNotNull(response);
//        assertEquals(expectedToken, response.getToken());
//    }

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

//    @Test
//    void registerBuyer_Success_ShouldReturnJwtResponse() {
//        // Given
//        RegisterRequest request = new RegisterRequest("New Buyer", "buyer@test.com", "Password123", "Test Region");
//        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
//        when(userService.createUser(any(), any())).thenReturn(User.builder().email("buyer@test.com").passwordHash("hashed").build());
//        when(jwtService.generateToken(any())).thenReturn("new.jwt.token");
//
//        // When
//        LoginResponse response = authenticationService.registerBuyer(request);
//
//        // Then
//        assertNotNull(response);
//        assertEquals("new.jwt.token", response.getToken());
//        verify(userService, times(1)).createUser(any(), any());
//    }

    @Test
    void registerBuyer_EmailExists_ShouldThrowConflictException() {
        // Given
        RegisterRequest request = new RegisterRequest("New Buyer", "buyer@test.com", "Password123", "Test Region");
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        // When & Then
        assertThrows(ConflictException.class, () -> authenticationService.registerBuyer(request));
        verify(userService, never()).createUser(any(), any());
    }
}