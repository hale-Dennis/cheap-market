package com.ftb.api.service;

import com.ftb.api.dto.response.PickupLocationResponseDto;
import com.ftb.api.mapper.PickupLocationMapper;
import com.ftb.api.repository.PickupLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PickupLocationService {

    private final PickupLocationRepository pickupLocationRepository;
    private final PickupLocationMapper pickupLocationMapper;

    @Transactional(readOnly = true)
    @Cacheable("pickupLocations")
    public List<PickupLocationResponseDto> getLocationsByRegion(String region) {
        return pickupLocationRepository.findByRegion(region)
                .stream()
                .map(pickupLocationMapper::toPickupLocationResponseDto)
                .collect(Collectors.toList());
    }
}