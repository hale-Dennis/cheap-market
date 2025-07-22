package com.ftb.api.repository;

import com.ftb.api.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    /**
     * Checks if any order item is associated with the given product ID.
     * @param productId The ID of the product to check.
     * @return true if at least one order item references the product, false otherwise.
     */
    boolean existsByProductId(UUID productId);
}