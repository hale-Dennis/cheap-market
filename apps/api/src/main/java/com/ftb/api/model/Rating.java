package com.ftb.api.model;

import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import java.time.Instant;
import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.CreationTimestamp;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
/** A buyer's rating of one farmer for one completed order; an order with several farmers gets one per farmer. */
@Table(name = "ratings", uniqueConstraints = @UniqueConstraint(
        name = "uk_ratings_order_farmer", columnNames = {"order_id", "farmer_id"}))
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    private User farmer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private int score;

    @Column(length = 300)
    private String comment;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}