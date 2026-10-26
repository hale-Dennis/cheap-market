package com.ftb.api.model;

import java.util.Locale;
import java.util.Set;


/** How the buyer's order history groups statuses into tabs. */
public enum OrderStatusGroup {
    ACTIVE(Set.of(OrderStatus.PENDING, OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY)),
    COMPLETED(Set.of(OrderStatus.COMPLETED)),
    DISPUTED(Set.of(OrderStatus.DISPUTED));

    private final Set<OrderStatus> statuses;

    OrderStatusGroup(Set<OrderStatus> statuses) {
        this.statuses = statuses;
    }

    public Set<OrderStatus> getStatuses() {
        return statuses;
    }

    public static OrderStatusGroup of(OrderStatus status) {
        for (OrderStatusGroup group : values()) {
            if (group.statuses.contains(status)) return group;
        }
        throw new IllegalArgumentException("No group for " + status);
    }

    /** From a ?status= value such as "active". */
    public static OrderStatusGroup fromParam(String value) {
        return valueOf(value.toUpperCase(Locale.ROOT));
    }
}
