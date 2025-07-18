package com.ftb.api.service;

import java.util.Collections;

import com.ftb.api.dto.request.RegisterRequest;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.model.UserRole;
import com.ftb.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.ftb.api.dto.request.LoginRequest;
import com.ftb.api.dto.response.JwtResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.authentication.BadCredentialsException;


@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final JwtService jwtService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;


    public JwtResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        final String jwt = jwtService.generateToken(userDetails);
        return JwtResponse.builder().token(jwt).build();
    }

    public JwtResponse registerBuyer(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("A user with this email already exists.");
        }

        com.ftb.api.model.User newUser = userService.createUser(request, UserRole.BUYER);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                newUser.getEmail(),
                newUser.getPasswordHash(),
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + newUser.getRole().name()))
        );

        final String jwt = jwtService.generateToken(userDetails);
        return JwtResponse.builder().token(jwt).build();
    }
}
