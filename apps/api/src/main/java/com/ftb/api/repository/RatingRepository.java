package com.ftb.api.repository;

import java.util.List;
import java.util.UUID;
import com.ftb.api.model.Rating;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;


@Repository
public interface RatingRepository extends JpaRepository<Rating, UUID> {

    /** Whether the buyer has already rated this farmer for this order. */
    boolean existsByOrderIdAndFarmerId(UUID orderId, UUID farmerId);

    boolean existsByFarmerId(UUID farmerId);

    List<Rating> findByOrderId(UUID orderId);

    long countByFarmerId(UUID farmerId);

    /** The farmer's mean score, or null if they have no ratings. */
    @Query("select avg(r.score) from Rating r where r.farmer.id = :farmerId")
    Double averageScoreByFarmerId(UUID farmerId);
}
