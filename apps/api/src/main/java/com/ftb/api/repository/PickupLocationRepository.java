package com.ftb.api.repository;

import com.ftb.api.model.PickupLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PickupLocationRepository extends JpaRepository<PickupLocation, UUID> {

    /**
     * Finds all pickup locations within a specific region.
     * @param region The region to filter by.
     * @return A list of matching PickupLocation entities.
     */
    List<PickupLocation> findByRegion(String region);
}