package com.ftb.api.repository;

import com.ftb.api.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RatingRepository extends JpaRepository<Rating, UUID> {

    /**
     * Checks if a rating exists for a given order ID and buyer ID.
     * @param orderId The UUID of the order.
     * @param buyerId The UUID of the buyer.
     * @return true if a rating exists, false otherwise.
     */
    boolean existsByOrderIdAndBuyerId(UUID orderId, UUID buyerId);
}