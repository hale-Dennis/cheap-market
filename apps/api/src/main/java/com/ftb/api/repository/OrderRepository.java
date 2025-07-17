package com.ftb.api.repository;

import java.util.UUID;
import com.ftb.api.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;


@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    /**
     * Finds a paginated list of all orders placed by a specific buyer.
     * @param buyerId The UUID of the buyer.
     * @param pageable The pagination information.
     * @return A Page object containing the buyer's orders.
     */
    Page<Order> findByBuyerId(UUID buyerId, Pageable pageable);
}