package com.ftb.api.service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.Locale;
import com.ftb.api.util.PhoneNumbers;
import com.ftb.api.exception.InvalidRequestException;

import com.ftb.api.dto.request.UpdateFarmerRequest;
import com.ftb.api.exception.ResourceNotFoundException;
import com.ftb.api.model.User;
import com.ftb.api.model.UserRole;
import java.util.stream.Collectors;

import com.ftb.api.repository.ProductRepository;
import com.ftb.api.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import com.ftb.api.mapper.FarmerMapper;
import com.ftb.api.model.AccountStatus;
import org.springframework.data.domain.Page;
import com.ftb.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.dto.response.FarmerResponse;
import org.springframework.data.domain.Pageable;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.dto.request.CreateFarmerRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;


@Service
@RequiredArgsConstructor
public class FarmerService {

    private final UserRepository userRepository;
    private final FarmerMapper farmerMapper;
    private final PasswordEncoder passwordEncoder;
    private final ProductRepository productRepository;
    private final RatingRepository ratingRepository;

    @Transactional
    public FarmerResponse createFarmer(CreateFarmerRequest request) {
        String email = normalizeOptionalEmail(request.getEmail());
        String phoneNumber = normalizePhoneNumber(request.getPhoneNumber());

        if (email != null && userRepository.existsByEmail(email)) {
            throw new ConflictException("A user with this email already exists.");
        }
        if (userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new ConflictException("A user with this phone number already exists.");
        }

        User user = farmerMapper.toUser(request);
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPhoneNumber(phoneNumber);
        user.setRole(UserRole.FARMER);
        user.setAccountStatus(AccountStatus.ACTIVE);
        String temporaryPassword = UUID.randomUUID().toString();
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));

        // Flush so the database-generated createdAt is populated in the response.
        User savedUser = userRepository.saveAndFlush(user);

        return farmerMapper.toFarmerResponse(savedUser);
    }

    /**
     * Retrieves a paginated list of all users with the 'FARMER' role.
     * @param pageable The pagination information provided by the controller.
     * @return A custom paginated response containing a list of farmers.
     */
    @Transactional(readOnly = true)
    public PaginatedResponse<FarmerResponse> getAllFarmers(Pageable pageable) {

        Page<User> farmerPage = userRepository.findByRole(UserRole.FARMER, pageable);

        List<FarmerResponse> farmerResponses = farmerPage.getContent().stream()
                .map(farmerMapper::toFarmerResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<FarmerResponse>builder()
                .content(farmerResponses)
                .currentPage(farmerPage.getNumber())
                .totalPages(farmerPage.getTotalPages())
                .totalElements(farmerPage.getTotalElements())
                .size(farmerPage.getSize())
                .build();
    }

    @Transactional
    public FarmerResponse updateFarmer(UUID farmerId, UpdateFarmerRequest request) {

        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + farmerId));

        String phoneNumber = normalizePhoneNumber(request.getPhoneNumber());
        if (!Objects.equals(farmer.getPhoneNumber(), phoneNumber) && userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new ConflictException("This phone number is already in use by another account.");
        }

        farmer.setFullName(request.getFullName().trim());
        farmer.setPhoneNumber(phoneNumber);
        farmer.setRegion(request.getRegion());
        farmer.setAccountStatus(request.getAccountStatus());

        User updatedFarmer = userRepository.save(farmer);
        return farmerMapper.toFarmerResponse(updatedFarmer);
    }

    @Transactional
    public void deleteFarmer(UUID farmerId) {
        if (!userRepository.existsById(farmerId)) {
            throw new ResourceNotFoundException("Farmer not found with id: " + farmerId);
        }

        if (productRepository.existsByFarmerId(farmerId)) {
            throw new ConflictException("Cannot delete a farmer with active product listings.");
        }

        if (ratingRepository.existsByFarmerId(farmerId)) {
            throw new ConflictException("Cannot delete a farmer who has received ratings.");
        }
        userRepository.deleteById(farmerId);
    }

    private static String normalizeOptionalEmail(String email) {
        return email == null || email.isBlank() ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhoneNumber(String phoneNumber) {
        return PhoneNumbers.normalizeGhanaian(phoneNumber)
                .orElseThrow(() -> new InvalidRequestException("Phone number must be a valid Ghanaian number."));
    }
}
