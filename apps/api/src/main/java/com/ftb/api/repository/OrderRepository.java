package com.ftb.api.repository;

import java.util.UUID;
import com.ftb.api.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
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

    /**
     * Checks if any order is associated with the given pickup location ID.
     * @param pickupLocationId The ID of the pickup location to check.
     * @return true if at least one order references the location, false otherwise.
     */
    boolean existsByPickupLocationId(UUID pickupLocationId);

    boolean existsByOrderNumber(String orderNumber);

    /** The order a buyer already placed for this checkout attempt, if any. */
    Optional<Order> findByBuyerIdAndIdempotencyKey(UUID buyerId, String idempotencyKey);

    /** Locks the order's row (with its buyer), so status changes to one order run one after another. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o join fetch o.buyer where o.id = :id")
    Optional<Order> lockById(UUID id);

    /** An order with everything the confirmation page shows, in one query. */
    @EntityGraph(attributePaths = {"buyer", "items", "items.product", "items.product.farmer", "pickupLocation"})
    Optional<Order> findWithDetailsById(UUID id);
}