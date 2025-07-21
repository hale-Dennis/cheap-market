package com.ftb.api.model;

import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import java.util.ArrayList;
import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;


@Entity
@Table(name = "carts")
@Getter
@Setter
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false, unique = true)
    private User buyer;

    @OneToMany(
            mappedBy = "cart",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<CartItem> items = new ArrayList<>();

    @UpdateTimestamp
    private Instant updatedAt;


    public void addItem(CartItem item) {
        items.add(item);
        item.setCart(this);
    }

    public void removeItem(CartItem item) {
        items.remove(item);
        item.setCart(null);
    }
}