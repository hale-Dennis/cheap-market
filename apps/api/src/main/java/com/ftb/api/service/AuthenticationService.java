package com.ftb.api.service;

import com.ftb.api.dto.request.LoginRequest;
import com.ftb.api.dto.response.JwtResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final JwtService jwtService;

    @Value("${application.security.admin.username}")
    private String adminUsername;

    @Value("${application.security.admin.password}")
    private String adminPassword;

    public JwtResponse login(LoginRequest request) {
        if (!adminUsername.equals(request.getEmail()) || !adminPassword.equals(request.getPassword())) {
            throw new BadCredentialsException("Invalid admin credentials");
        }

        UserDetails userDetails = new User(
                adminUsername,
                adminPassword,
                Collections.singleton(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        final String jwt = jwtService.generateToken(userDetails);
        return JwtResponse.builder().token(jwt).build();
    }
}
