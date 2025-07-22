package com.ftb.api.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.ftb.api.dto.request.CreatePickupLocationRequest;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.exception.ResourceNotFoundException;
import com.ftb.api.model.PickupLocation;
import com.ftb.api.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    @Cacheable("pickupLocations")
    public List<PickupLocationResponseDto> getLocationsByRegion(String region) {
        return pickupLocationRepository.findByRegion(region)
                .stream()
                .map(pickupLocationMapper::toPickupLocationResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "pickupLocations", allEntries = true)
    public PickupLocationResponseDto createLocation(CreatePickupLocationRequest request) {
        PickupLocation location = pickupLocationMapper.toPickupLocation(request);
        PickupLocation savedLocation = pickupLocationRepository.save(location);
        return pickupLocationMapper.toPickupLocationResponseDto(savedLocation);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<PickupLocationResponseDto> listAllLocations(Pageable pageable) {
        Page<PickupLocation> locationPage = pickupLocationRepository.findAll(pageable);
        List<PickupLocationResponseDto> locations = locationPage.getContent().stream()
                .map(pickupLocationMapper::toPickupLocationResponseDto)
                .collect(Collectors.toList());

        return PaginatedResponse.<PickupLocationResponseDto>builder()
                .content(locations)
                .currentPage(locationPage.getNumber())
                .totalPages(locationPage.getTotalPages())
                .totalElements(locationPage.getTotalElements())
                .size(locationPage.getSize())
                .build();
    }

    @Transactional
    @CacheEvict(value = "pickupLocations", allEntries = true)
    public PickupLocationResponseDto updateLocation(UUID locationId, CreatePickupLocationRequest request) {
        PickupLocation location = pickupLocationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup location not found with id: " + locationId));

        location.setName(request.getName());
        location.setAddress(request.getAddress());
        location.setRegion(request.getRegion());
        location.setOperatingHours(request.getOperatingHours());

        PickupLocation updatedLocation = pickupLocationRepository.save(location);
        return pickupLocationMapper.toPickupLocationResponseDto(updatedLocation);
    }

    @Transactional
    @CacheEvict(value = "pickupLocations", allEntries = true)
    public void deleteLocation(UUID locationId) {
        if (!pickupLocationRepository.existsById(locationId)) {
            throw new ResourceNotFoundException("Pickup location not found with id: " + locationId);
        }
        if (orderRepository.existsByPickupLocationId(locationId)) {
            throw new ConflictException("Location cannot be deleted because it is associated with existing orders.");
        }
        pickupLocationRepository.deleteById(locationId);
    }
}