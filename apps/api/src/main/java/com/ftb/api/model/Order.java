package com.ftb.api.model;

import lombok.Data;
import lombok.Builder;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import java.math.BigDecimal;
import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "orders", uniqueConstraints = {
        @UniqueConstraint(name = "uk_orders_order_number", columnNames = "order_number"),
        // A buyer's retry of the same checkout (same Idempotency-Key) must not create a second order.
        @UniqueConstraint(name = "uk_orders_buyer_idempotency_key", columnNames = {"buyer_id", "idempotency_key"})
})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Short reference shown to buyers and admins, e.g. CM-7K3F9Q2X. */
    @Column(name = "order_number", length = 16)
    private String orderNumber;

    /** Client-supplied key identifying one checkout attempt; null when the client sent none. */
    @Column(name = "idempotency_key", length = 64)
    private String idempotencyKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_location_id")
    private PickupLocation pickupLocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus  = PaymentStatus.UNPAID;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FulfillmentType fulfillmentType;

    @Embedded
    private Address deliveryAddress;

    @Column(nullable = false)
    private BigDecimal itemsSubtotal;

    @Column(nullable = false)
    private BigDecimal deliveryFee;

    @Column(nullable = false)
    private BigDecimal finalTotal;

    /** Total quantity across the order's items, computed by the database (no need to load the items). */
    @Formula("(select coalesce(sum(oi.quantity), 0) from order_items oi where oi.order_id = id)")
    private Integer itemCount;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}