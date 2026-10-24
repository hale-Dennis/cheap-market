package com.ftb.api.repository;

import java.util.List;
import java.util.UUID;
import java.util.Collection;
import com.ftb.api.model.OrderItem;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    /**
     * Checks if any order item is associated with the given product ID.
     * @param productId The ID of the product to check.
     * @return true if at least one order item references the product, false otherwise.
     */
    boolean existsByProductId(UUID productId);

    /** A farmer in a completed order whom the buyer hasn't rated yet. */
    interface UnratedFarmer {
        UUID getOrderId();
        UUID getFarmerId();
        String getFullName();
    }

    /** For a page of orders, the farmers still waiting for a rating (completed or disputed orders), in one query. */
    @Query("""
            select distinct o.id as orderId, f.id as farmerId, f.fullName as fullName
            from OrderItem oi join oi.order o join oi.product p join p.farmer f
            where o.id in :orderIds
              and o.status in (com.ftb.api.model.OrderStatus.COMPLETED, com.ftb.api.model.OrderStatus.DISPUTED)
              and not exists (select r.id from Rating r where r.order = o and r.farmer = f)
            order by f.fullName""")
    List<UnratedFarmer> findUnratedFarmers(Collection<UUID> orderIds);
}
