package com.ftb.api.service;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.mockito.Mock;
import java.util.Collections;
import com.ftb.api.model.User;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import com.ftb.api.model.UserRole;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import com.ftb.api.mapper.FarmerMapper;
import com.ftb.api.model.AccountStatus;
import org.springframework.data.domain.Page;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.repository.RatingRepository;
import com.ftb.api.repository.ProductRepository;
import static org.mockito.ArgumentMatchers.any;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.dto.response.FarmerResponse;
import com.ftb.api.dto.request.UpdateFarmerRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import static org.junit.jupiter.api.Assertions.*;
import com.ftb.api.dto.response.PaginatedResponse;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import com.ftb.api.dto.request.CreateFarmerRequest;
import com.ftb.api.exception.ResourceNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;


@ExtendWith(MockitoExtension.class)
class FarmerServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private FarmerMapper farmerMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private RatingRepository ratingRepository;

    @InjectMocks
    private FarmerService farmerService;

    @Test
    void createFarmer_Success_ShouldPersistActiveFarmerWithNormalisedContactDetails() {
        CreateFarmerRequest request = new CreateFarmerRequest(" Ama Mensah ", " Ama@Test.com ", "024 123 4567", "ASHANTI");
        when(farmerMapper.toUser(request)).thenReturn(User.builder().region("ASHANTI").build());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-temporary-password");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        FarmerResponse expected = FarmerResponse.builder().fullName("Ama Mensah").build();
        when(farmerMapper.toFarmerResponse(any(User.class))).thenReturn(expected);

        FarmerResponse response = farmerService.createFarmer(request);

        assertSame(expected, response);
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(saved.capture());
        User farmer = saved.getValue();
        assertEquals("Ama Mensah", farmer.getFullName());
        assertEquals("ama@test.com", farmer.getEmail());
        assertEquals("+233241234567", farmer.getPhoneNumber());
        assertEquals("ASHANTI", farmer.getRegion());
        assertEquals(UserRole.FARMER, farmer.getRole());
        assertEquals(AccountStatus.ACTIVE, farmer.getAccountStatus());
        assertEquals("hashed-temporary-password", farmer.getPasswordHash());
        verify(userRepository).existsByEmail("ama@test.com");
        verify(userRepository).existsByPhoneNumber("+233241234567");
    }

    @Test
    void createFarmer_EmailAlreadyExists_ShouldThrowConflictException() {
        CreateFarmerRequest request = new CreateFarmerRequest("John Doe", "john.doe@test.com", "0241234567", "ASHANTI");
        when(userRepository.existsByEmail("john.doe@test.com")).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () -> farmerService.createFarmer(request));
        assertEquals("A user with this email already exists.", exception.getMessage());
        verify(userRepository, never()).saveAndFlush(any(User.class));
    }

    @Test
    void createFarmer_PhoneNumberAlreadyExistsInAnotherFormat_ShouldThrowConflictException() {
        CreateFarmerRequest request = new CreateFarmerRequest("Jane Doe", "jane.doe@test.com", "+233 24 123 4567", "ASHANTI");
        when(userRepository.existsByEmail("jane.doe@test.com")).thenReturn(false);
        when(userRepository.existsByPhoneNumber("+233241234567")).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () -> farmerService.createFarmer(request));
        assertEquals("A user with this phone number already exists.", exception.getMessage());
        verify(userRepository, never()).saveAndFlush(any(User.class));
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

        assertEquals(1, response.getContent().size());
        assertEquals(0, response.getCurrentPage());
        assertEquals(1, response.getTotalPages());
        assertEquals(1, response.getTotalElements());
        verify(userRepository, times(1)).findByRole(UserRole.FARMER, pageable);
    }

    @Test
    void updateFarmer_ShouldNormalisePhoneNumberBeforeCheckingDuplicates() {
        UUID id = UUID.randomUUID();
        User farmer = User.builder().id(id).phoneNumber("+233241234567").build();
        UpdateFarmerRequest request = new UpdateFarmerRequest();
        request.setFullName("Ama Mensah");
        request.setPhoneNumber("0241234567");
        request.setRegion("VOLTA");
        request.setAccountStatus(AccountStatus.SUSPENDED);
        when(userRepository.findById(id)).thenReturn(Optional.of(farmer));
        when(userRepository.save(farmer)).thenReturn(farmer);
        when(farmerMapper.toFarmerResponse(farmer)).thenReturn(new FarmerResponse());

        farmerService.updateFarmer(id, request);

        verify(userRepository, never()).existsByPhoneNumber(any());
        assertEquals("+233241234567", farmer.getPhoneNumber());
        assertEquals("VOLTA", farmer.getRegion());
        assertEquals(AccountStatus.SUSPENDED, farmer.getAccountStatus());
    }

    @Test
    void updateFarmer_UnknownId_ShouldThrowResourceNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> farmerService.updateFarmer(id, new UpdateFarmerRequest()));
    }
}
