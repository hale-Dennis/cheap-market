package com.ftb.api.service;

import java.util.Collections;
import com.ftb.api.model.RefreshToken;
import com.ftb.api.dto.request.RegisterRequest;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.repository.UserRepository;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.junit.jupiter.api.Test;

import com.ftb.api.dto.request.LoginRequest;
import com.ftb.api.dto.response.LoginResponse;
import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;


@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthenticationService authenticationService;

    @Test
    void login_WithValidCredentials_ShouldReturnAccessAndRefreshTokens() {
        LoginRequest request = new LoginRequest("admin@test.com", "password123");
        UserDetails admin = new User("admin@test.com", "hashed",
                Collections.singleton(new SimpleGrantedAuthority("ROLE_ADMIN")));
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token");

        when(userDetailsService.loadUserByUsername("admin@test.com")).thenReturn(admin);
        when(jwtService.generateToken(admin)).thenReturn("mock.jwt.token");
        when(refreshTokenService.createRefreshToken("admin@test.com")).thenReturn(refreshToken);

        LoginResponse response = authenticationService.login(request);

        assertEquals("mock.jwt.token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        verify(authenticationManager).authenticate(
                new UsernamePasswordAuthenticationToken("admin@test.com", "password123"));
    }

    @Test
    void login_WithInvalidCredentials_ShouldThrowBadCredentialsException() {
        LoginRequest request = new LoginRequest("admin@test.com", "wrongpassword");
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> authenticationService.login(request));
        verifyNoInteractions(jwtService, refreshTokenService);
    }

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
