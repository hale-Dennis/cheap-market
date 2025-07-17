package com.ftb.api.service;

import com.ftb.api.dto.request.RegisterRequest;
import com.ftb.api.dto.request.UpdateBuyerProfileRequest;
import com.ftb.api.dto.response.BuyerProfileResponse;
import com.ftb.api.mapper.UserMapper;
import com.ftb.api.model.AccountStatus;
import com.ftb.api.model.User;

import com.ftb.api.model.UserRole;
import com.ftb.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User createUser(RegisterRequest request, UserRole role) {
        User user = userMapper.toUser(request);
        user.setRole(role);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public BuyerProfileResponse getBuyerProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return userMapper.toBuyerProfileResponse(user);
    }

    @Transactional
    public BuyerProfileResponse updateBuyerProfile(String email, UpdateBuyerProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Use the mapper to apply non-null updates from the DTO
        userMapper.updateUserFromDto(request, user);

        // Persist the changes
        User updatedUser = userRepository.save(user);

        return userMapper.toBuyerProfileResponse(updatedUser);
    }
}