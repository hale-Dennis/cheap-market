package com.ftb.api.service;

import java.util.List;
import org.mockito.Mock;
import java.util.Collections;
import com.ftb.api.model.User;
import org.mockito.InjectMocks;
import com.ftb.api.model.UserRole;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import com.ftb.api.mapper.FarmerMapper;
import org.springframework.data.domain.Page;
import com.ftb.api.repository.UserRepository;
import static org.mockito.ArgumentMatchers.any;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.dto.response.FarmerResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import static org.junit.jupiter.api.Assertions.*;
import com.ftb.api.dto.response.PaginatedResponse;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import com.ftb.api.dto.request.CreateFarmerRequest;
import org.springframework.security.crypto.password.PasswordEncoder;



@ExtendWith(MockitoExtension.class)
class FarmerServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private FarmerMapper farmerMapper;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private FarmerService farmerService;

    @Test
    void createFarmer_Success_ShouldReturnFarmerResponse() {

        CreateFarmerRequest request = new CreateFarmerRequest("John Doe", "john.doe@test.com", "1234567890", "Test Region");
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(userRepository.existsByPhoneNumber(request.getPhoneNumber())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(new User());
        when(farmerMapper.toFarmerResponse(any(User.class))).thenReturn(new FarmerResponse());

        FarmerResponse response = farmerService.createFarmer(request);

        assertNotNull(response);
        verify(userRepository, times(1)).save(any(User.class));
        verify(passwordEncoder, times(1)).encode(anyString());
    }

    @Test
    void createFarmer_EmailAlreadyExists_ShouldThrowConflictException() {
        CreateFarmerRequest request = new CreateFarmerRequest("John Doe", "john.doe@test.com", "1234567890", "Test Region");
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () -> farmerService.createFarmer(request));
        assertEquals("A user with this email already exists.", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createFarmer_PhoneNumberAlreadyExists_ShouldThrowConflictException() {

        CreateFarmerRequest request = new CreateFarmerRequest("Jane Doe", "jane.doe@test.com", "0987654321", "Test Region");
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(userRepository.existsByPhoneNumber(request.getPhoneNumber())).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () -> farmerService.createFarmer(request));
        assertEquals("A user with this phone number already exists.", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void getAllFarmers_ShouldReturnPaginatedResponse() {

        Pageable pageable = PageRequest.of(0, 10);
        User farmer = User.builder().fullName("Test Farmer").build();
        List<User> farmerList = Collections.singletonList(farmer);
        Page<User> farmerPage = new PageImpl<>(farmerList, pageable, 1);

        when(userRepository.findByRole(UserRole.FARMER, pageable)).thenReturn(farmerPage);
        when(farmerMapper.toFarmerResponse(any(User.class))).thenReturn(new FarmerResponse());

        PaginatedResponse<FarmerResponse> response = farmerService.getAllFarmers(pageable);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals(0, response.getCurrentPage());
        assertEquals(1, response.getTotalPages());
        assertEquals(1, response.getTotalElements());
        verify(userRepository, times(1)).findByRole(UserRole.FARMER, pageable);
    }
}