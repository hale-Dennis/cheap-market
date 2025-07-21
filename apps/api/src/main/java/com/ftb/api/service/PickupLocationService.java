package com.ftb.api.service;

import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.ftb.api.mapper.PickupLocationMapper;
import org.springframework.cache.annotation.Cacheable;
import com.ftb.api.repository.PickupLocationRepository;
import com.ftb.api.dto.response.PickupLocationResponseDto;
import org.springframework.transaction.annotation.Transactional;


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