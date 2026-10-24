package com.ftb.api.service;

import java.time.Instant;
import java.util.Optional;
import com.ftb.api.model.User;
import org.mockito.Mock;
import org.junit.jupiter.api.Test;
import com.ftb.api.model.RefreshToken;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.repository.UserRepository;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import com.ftb.api.repository.RefreshTokenRepository;
import org.springframework.test.util.ReflectionTestUtils;


@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private UserRepository userRepository;

    private RefreshTokenService refreshTokenService;

    private final User user = User.builder().email("admin@test.com").build();

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, userRepository);
        ReflectionTestUtils.setField(refreshTokenService, "refreshTokenDurationMs", 60_000L);
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(user));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createRefreshToken_FirstLogin_ShouldCreateNewToken() {
        when(refreshTokenRepository.findByUser(user)).thenReturn(Optional.empty());

        RefreshToken token = refreshTokenService.createRefreshToken("admin@test.com");

        assertSame(user, token.getUser());
        assertNotNull(token.getToken());
        assertTrue(token.getExpiryDate().isAfter(Instant.now()));
    }

    @Test
    void createRefreshToken_RepeatLogin_ShouldRotateExistingTokenInPlace() {
        RefreshToken existing = new RefreshToken();
        existing.setId(42L);
        existing.setUser(user);
        existing.setToken("old-token");
        existing.setExpiryDate(Instant.now().minusSeconds(10));
        when(refreshTokenRepository.findByUser(user)).thenReturn(Optional.of(existing));

        RefreshToken token = refreshTokenService.createRefreshToken("admin@test.com");

        assertSame(existing, token);
        assertEquals(42L, token.getId());
        assertNotEquals("old-token", token.getToken());
        assertTrue(token.getExpiryDate().isAfter(Instant.now()));
        verify(refreshTokenRepository, never()).delete(any());
    }
}
