package com.ftb.api.service;

import java.util.Locale;
import com.ftb.api.model.User;
import com.ftb.api.model.Address;
import com.ftb.api.dto.request.AddressRequest;
import com.ftb.api.model.UserRole;
import com.ftb.api.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import com.ftb.api.model.AccountStatus;
import com.ftb.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import com.ftb.api.dto.request.RegisterRequest;
import com.ftb.api.dto.response.BuyerProfileResponse;
import com.ftb.api.dto.request.UpdateBuyerProfileRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;


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

        user.setFullName(request.getFullName().trim());
        user.setRegion(request.getRegion());
        user.setDeliveryAddress(toAddress(request.getDeliveryAddress()));

        User updatedUser = userRepository.save(user);

        return userMapper.toBuyerProfileResponse(updatedUser);
    }

    private static Address toAddress(AddressRequest request) {
        if (request == null) {
            return null;
        }
        String gpsAddress = request.getGpsAddress() == null || request.getGpsAddress().isBlank()
                ? null
                : request.getGpsAddress().trim().toUpperCase(Locale.ROOT);
        return Address.builder()
                .street(request.getStreet().trim())
                .town(request.getTown().trim())
                .gpsAddress(gpsAddress)
                .build();
    }
}
