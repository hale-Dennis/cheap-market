package com.ftb.api.repository;

import com.ftb.api.model.Dispute;
import com.ftb.api.model.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;
import java.util.Collection;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {

    /**
     * Checks if a dispute exists for a given order ID.
     * @param orderId The UUID of the order.
     * @return true if a dispute for the order exists, false otherwise.
     */
    boolean existsByOrderId(UUID orderId);

    Optional<Dispute> findByOrderId(UUID orderId);

    long countByStatusIn(Collection<DisputeStatus> statuses);
}
