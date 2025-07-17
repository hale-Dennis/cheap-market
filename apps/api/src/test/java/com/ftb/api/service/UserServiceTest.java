package com.ftb.api.service;

import com.ftb.api.dto.request.UpdateBuyerProfileRequest;
import com.ftb.api.dto.response.BuyerProfileResponse;
import com.ftb.api.mapper.UserMapper;
import com.ftb.api.model.User;
import com.ftb.api.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    @Test
    void getBuyerProfile_UserExists_ShouldReturnProfile() {
        // Given
        String email = "buyer@test.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(new User()));
        when(userMapper.toBuyerProfileResponse(any())).thenReturn(new BuyerProfileResponse());

        // When
        BuyerProfileResponse response = userService.getBuyerProfile(email);

        // Then
        assertNotNull(response);
    }

    @Test
    void getBuyerProfile_UserNotFound_ShouldThrowException() {
        // Given
        String email = "nonexistent@test.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(UsernameNotFoundException.class, () -> userService.getBuyerProfile(email));
    }

    @Test
    void updateBuyerProfile_UserExists_ShouldUpdateAndReturnProfile() {
        // Given
        String email = "buyer@test.com";
        UpdateBuyerProfileRequest request = new UpdateBuyerProfileRequest();
        User existingUser = new User();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);
        when(userMapper.toBuyerProfileResponse(any(User.class))).thenReturn(new BuyerProfileResponse());

        // When
        BuyerProfileResponse response = userService.updateBuyerProfile(email, request);

        // Then
        assertNotNull(response);
        verify(userMapper, times(1)).updateUserFromDto(request, existingUser);
        verify(userRepository, times(1)).save(existingUser);
    }
}