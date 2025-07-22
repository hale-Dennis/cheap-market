package com.ftb.api.service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

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
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("A user with this email already exists.");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new ConflictException("A user with this phone number already exists.");
        }

        User user = farmerMapper.toUser(request);
        user.setRole(UserRole.FARMER);
        user.setAccountStatus(AccountStatus.ACTIVE);
        String temporaryPassword = UUID.randomUUID().toString();
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));

        User savedUser = userRepository.save(user);

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

        if (!Objects.equals(farmer.getPhoneNumber(), request.getPhoneNumber()) && userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new ConflictException("This phone number is already in use by another account.");
        }

        farmer.setFullName(request.getFullName());
        farmer.setPhoneNumber(request.getPhoneNumber());
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
}