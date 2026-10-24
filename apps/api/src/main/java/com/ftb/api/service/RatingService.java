package com.ftb.api.service;

import java.util.UUID;
import java.math.BigDecimal;
import com.ftb.api.model.User;
import java.math.RoundingMode;
import com.ftb.api.model.Order;
import com.ftb.api.model.Rating;
import com.ftb.api.model.UserRole;
import com.ftb.api.model.OrderStatus;
import lombok.RequiredArgsConstructor;
import com.ftb.api.mapper.RatingMapper;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.repository.OrderRepository;
import org.springframework.stereotype.Service;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.repository.RatingRepository;
import com.ftb.api.dto.response.RatingResponseDto;
import com.ftb.api.dto.request.CreateRatingRequest;
import com.ftb.api.exception.InvalidRequestException;
import com.ftb.api.exception.ResourceNotFoundException;
import com.ftb.api.dto.response.FarmerRatingSummaryDto;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;


@Service
@RequiredArgsConstructor
public class RatingService {

    public static final String ORDER_NOT_COMPLETED = "ORDER_NOT_COMPLETED";
    public static final String FARMER_NOT_IN_ORDER = "FARMER_NOT_IN_ORDER";
    public static final String ALREADY_RATED = "ALREADY_RATED";

    private final RatingRepository ratingRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final RatingMapper ratingMapper;

    /**
     * Rates one farmer from one of the buyer's completed orders, then recalculates the farmer's average.
     * Another buyer's order is reported as not found, as for GET /orders/{id}.
     */
    @Transactional
    public RatingResponseDto createRating(String buyerEmail, CreateRatingRequest request) {
        Order order = orderRepository.findWithDetailsById(request.getOrderId())
                .filter(o -> o.getBuyer().getEmail().equals(buyerEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new InvalidRequestException(ORDER_NOT_COMPLETED, "You can rate farmers once the order is completed.");
        }
        boolean farmerInOrder = order.getItems().stream()
                .anyMatch(item -> item.getProduct().getFarmer().getId().equals(request.getFarmerId()));
        if (!farmerInOrder) {
            throw new InvalidRequestException(FARMER_NOT_IN_ORDER, "That farmer didn't supply this order.");
        }

        // Lock the farmer first: concurrent ratings for them then queue here, and each recalculation sees the last.
        User farmer = userRepository.lockById(request.getFarmerId())
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + request.getFarmerId()));
        if (ratingRepository.existsByOrderIdAndFarmerId(order.getId(), farmer.getId())) {
            throw alreadyRated();
        }

        Rating rating = Rating.builder()
                .buyer(order.getBuyer())
                .order(order)
                .farmer(farmer)
                .score(request.getScore())
                .comment(blankToNull(request.getComment()))
                .build();
        try {
            ratingRepository.saveAndFlush(rating);
        } catch (DataIntegrityViolationException e) {
            // A simultaneous duplicate got in first (unique order + farmer).
            throw alreadyRated();
        }

        recalculateAverage(farmer);
        return ratingMapper.toRatingResponseDto(rating);
    }

    @Transactional(readOnly = true)
    public FarmerRatingSummaryDto getFarmerRating(UUID farmerId) {
        if (!userRepository.existsByIdAndRole(farmerId, UserRole.FARMER)) {
            throw new ResourceNotFoundException("Farmer not found with id: " + farmerId);
        }
        long count = ratingRepository.countByFarmerId(farmerId);
        return FarmerRatingSummaryDto.builder()
                .farmerId(farmerId)
                .averageRating(count == 0 ? null : roundAverage(ratingRepository.averageScoreByFarmerId(farmerId)))
                .ratingCount(Math.toIntExact(count))
                .build();
    }

    /** Recomputes from all of the farmer's ratings rather than adjusting the stored value, so it can't drift. */
    private void recalculateAverage(User farmer) {
        farmer.setRatingCount(Math.toIntExact(ratingRepository.countByFarmerId(farmer.getId())));
        farmer.setAverageRating(roundAverage(ratingRepository.averageScoreByFarmerId(farmer.getId())));
        userRepository.save(farmer);
    }

    private static Double roundAverage(Double average) {
        return average == null ? null : BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private static String blankToNull(String comment) {
        return comment == null || comment.isBlank() ? null : comment.strip();
    }

    private static ConflictException alreadyRated() {
        return new ConflictException(ALREADY_RATED, "You've already rated this farmer for this order.");
    }
}
