package com.ftb.api.model;

import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import java.time.Instant;
import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;


/**
 * A message for System Admins, shown on the admin dashboard. Stored so a future worker can also
 * send it by email or SMS.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications", indexes = @Index(name = "idx_notifications_created_at", columnList = "createdAt"))
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false, length = 500)
    private String message;

    /** The order this is about, if any. */
    private UUID orderId;

    @CreationTimestamp
    private Instant createdAt;

    /** Null until an admin marks it as read. */
    private Instant readAt;
}
