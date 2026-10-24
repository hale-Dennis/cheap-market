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
    void login_ShouldAuthenticateWithNormalisedEmail() {
        UserDetails buyer = new User("jane@example.com", "hashed",
                Collections.singleton(new SimpleGrantedAuthority("ROLE_BUYER")));
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token");
        when(userDetailsService.loadUserByUsername("jane@example.com")).thenReturn(buyer);
        when(jwtService.generateToken(buyer)).thenReturn("token");
        when(refreshTokenService.createRefreshToken("jane@example.com")).thenReturn(refreshToken);

        authenticationService.login(new LoginRequest("  Jane@Example.COM ", "Password123"));

        verify(authenticationManager).authenticate(
                new UsernamePasswordAuthenticationToken("jane@example.com", "Password123"));
    }

    @Test
    void registerBuyer_ShouldCreateBuyerWithNormalisedEmailAndLogThemIn() {
        RegisterRequest request = new RegisterRequest(" Jane Doe ", " Jane@Example.com ", "Password123", "ASHANTI");
        com.ftb.api.model.User saved = com.ftb.api.model.User.builder()
                .email("jane@example.com").passwordHash("hashed").role(com.ftb.api.model.UserRole.BUYER).build();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token");
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(userService.createUser(request, com.ftb.api.model.UserRole.BUYER)).thenReturn(saved);
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken("jane@example.com")).thenReturn(refreshToken);

        LoginResponse response = authenticationService.registerBuyer(request);

        assertEquals("jane@example.com", request.getEmail());
        assertEquals("Jane Doe", request.getFullName());
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        org.mockito.ArgumentCaptor<UserDetails> details = org.mockito.ArgumentCaptor.forClass(UserDetails.class);
        verify(jwtService).generateToken(details.capture());
        assertTrue(details.getValue().getAuthorities().contains(new SimpleGrantedAuthority("ROLE_BUYER")));
    }

    @Test
    void registerBuyer_EmailExists_ShouldThrowConflictException() {
        // Given
        RegisterRequest request = new RegisterRequest("New Buyer", "Buyer@Test.com", "Password123", "ASHANTI");
        when(userRepository.existsByEmail("buyer@test.com")).thenReturn(true);

        // When & Then
        assertThrows(ConflictException.class, () -> authenticationService.registerBuyer(request));
        verify(userService, never()).createUser(any(), any());
    }
}
