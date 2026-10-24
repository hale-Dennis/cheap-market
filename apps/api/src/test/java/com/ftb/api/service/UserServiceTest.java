package com.ftb.api.service;

import com.ftb.api.dto.request.UpdateBuyerProfileRequest;
import com.ftb.api.dto.response.BuyerProfileResponse;
import com.ftb.api.mapper.UserMapper;
import com.ftb.api.model.User;
import com.ftb.api.model.Address;
import com.ftb.api.dto.request.AddressRequest;
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
    void updateBuyerProfile_ShouldReplaceEditableFieldsAndNormaliseAddress() {
        String email = "buyer@test.com";
        UpdateBuyerProfileRequest request = new UpdateBuyerProfileRequest(
                "  Jane Doe ", "GREATER_ACCRA", new AddressRequest(" 12 Ring Rd ", " Accra ", " ga-184-2278 "));
        User existingUser = User.builder().email(email).fullName("Old Name").region("ASHANTI").build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(existingUser)).thenReturn(existingUser);
        BuyerProfileResponse expected = new BuyerProfileResponse();
        when(userMapper.toBuyerProfileResponse(existingUser)).thenReturn(expected);

        BuyerProfileResponse response = userService.updateBuyerProfile(email, request);

        assertSame(expected, response);
        assertEquals("Jane Doe", existingUser.getFullName());
        assertEquals("GREATER_ACCRA", existingUser.getRegion());
        assertEquals(new Address("12 Ring Rd", "Accra", "GA-184-2278"), existingUser.getDeliveryAddress());
        assertEquals(email, existingUser.getEmail());
    }

    @Test
    void updateBuyerProfile_BlankGpsAndNoAddress_ShouldStoreNulls() {
        String email = "buyer@test.com";
        User existingUser = User.builder().email(email)
                .deliveryAddress(new Address("Old St", "Old Town", "AK-000-0000")).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(existingUser)).thenReturn(existingUser);

        userService.updateBuyerProfile(email,
                new UpdateBuyerProfileRequest("Jane", "VOLTA", new AddressRequest("1 Main St", "Ho", "  ")));
        assertNull(existingUser.getDeliveryAddress().getGpsAddress());

        userService.updateBuyerProfile(email, new UpdateBuyerProfileRequest("Jane", "VOLTA", null));
        assertNull(existingUser.getDeliveryAddress());
    }

    @Test
    void updateBuyerProfile_UserNotFound_ShouldThrowException() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> userService.updateBuyerProfile("ghost@test.com",
                new UpdateBuyerProfileRequest("Jane", "VOLTA", null)));
        verify(userRepository, never()).save(any());
    }
}