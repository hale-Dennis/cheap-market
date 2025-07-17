package com.ftb.api.repository;

import com.ftb.api.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartRepository extends JpaRepository<Cart, UUID> {

    /**
     * Finds a cart by the ID of the buyer who owns it.
     * @param buyerId The UUID of the buyer.
     * @return An Optional containing the Cart if found.
     */
    Optional<Cart> findByBuyerId(UUID buyerId);
}