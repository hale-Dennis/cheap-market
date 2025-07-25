package com.ftb.api.service;

import java.util.Collections;

import com.ftb.api.dto.request.RefreshTokenRequest;
import com.ftb.api.dto.request.RegisterRequest;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.exception.TokenRefreshException;
import com.ftb.api.model.RefreshToken;
import com.ftb.api.model.UserRole;
import com.ftb.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.ftb.api.dto.request.LoginRequest;
import com.ftb.api.dto.response.LoginResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.authority.SimpleGrantedAuthority;


@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final JwtService jwtService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final RefreshTokenService refreshTokenService;


    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        final String accessToken = jwtService.generateToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getUsername());
        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .build();
    }

    public LoginResponse registerBuyer(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("A user with this email already exists.");
        }

        com.ftb.api.model.User newUser = userService.createUser(request, UserRole.BUYER);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                newUser.getEmail(),
                newUser.getPasswordHash(),
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + newUser.getRole().name()))
        );

        String accessToken = jwtService.generateToken(userDetails
        );
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(newUser.getEmail());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .build();
    }

    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                            user.getEmail(),
                            user.getPasswordHash(),
                            Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                    );
                    String newAccessToken = jwtService.generateToken(userDetails);
                    return new LoginResponse(newAccessToken, requestRefreshToken);
                })
                .orElseThrow(() -> new TokenRefreshException(requestRefreshToken, "Refresh token is not in the database."));
    }


}
