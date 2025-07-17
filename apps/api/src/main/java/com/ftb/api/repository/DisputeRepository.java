package com.ftb.api.repository;

import com.ftb.api.model.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {

    /**
     * Checks if a dispute exists for a given order ID.
     * @param orderId The UUID of the order.
     * @return true if a dispute for the order exists, false otherwise.
     */
    boolean existsByOrderId(UUID orderId);
}