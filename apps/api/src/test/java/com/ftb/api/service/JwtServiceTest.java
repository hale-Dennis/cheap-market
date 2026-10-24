package com.ftb.api.service;

import java.util.Collections;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.authority.SimpleGrantedAuthority;


class JwtServiceTest {

    // Base64 of a test key (at least 32 bytes, as HS256 requires).
    private static final String SECRET = "dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3_600_000L);
    }

    @Test
    void generateToken_ShouldIncludeSubjectAndRoleClaim() {
        UserDetails admin = new User("admin@test.com", "hashed",
                Collections.singleton(new SimpleGrantedAuthority("ROLE_ADMIN")));

        String token = jwtService.generateToken(admin);

        assertEquals("admin@test.com", jwtService.extractUsername(token));
        assertEquals("ADMIN", jwtService.extractClaim(token, claims -> claims.get(JwtService.ROLE_CLAIM, String.class)));
        assertTrue(jwtService.isTokenValid(token, admin));
    }

    @Test
    void generateToken_ShouldExpireAfterOneHour() {
        UserDetails admin = new User("admin@test.com", "hashed",
                Collections.singleton(new SimpleGrantedAuthority("ROLE_ADMIN")));

        String token = jwtService.generateToken(admin);

        long lifetimeMs = jwtService.extractClaim(token,
                claims -> claims.getExpiration().getTime() - claims.getIssuedAt().getTime());
        assertEquals(3_600_000L, lifetimeMs);
    }

    @Test
    void isTokenValid_ForDifferentUser_ShouldReturnFalse() {
        UserDetails admin = new User("admin@test.com", "hashed",
                Collections.singleton(new SimpleGrantedAuthority("ROLE_ADMIN")));
        UserDetails other = new User("other@test.com", "hashed",
                Collections.singleton(new SimpleGrantedAuthority("ROLE_BUYER")));

        String token = jwtService.generateToken(admin);

        assertFalse(jwtService.isTokenValid(token, other));
    }
}
