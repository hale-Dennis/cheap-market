package com.ftb.api.repository;

import java.util.UUID;
import java.time.Instant;
import com.ftb.api.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;


@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByReadAtIsNull();

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :now WHERE n.readAt IS NULL")
    int markAllRead(@Param("now") Instant now);
}
