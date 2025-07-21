package com.ftb.api.service;

import java.util.UUID;
import java.math.BigDecimal;
import com.ftb.api.model.User;
import java.math.RoundingMode;
import com.ftb.api.model.Order;
import com.ftb.api.model.Rating;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.userdetails.UsernameNotFoundException;


@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final RatingMapper ratingMapper;

    @Transactional
    public RatingResponseDto createRating(String buyerEmail, CreateRatingRequest request) {

        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + buyerEmail));
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));


        if (!order.getBuyer().getId().equals(buyer.getId())) {
            throw new InvalidRequestException("You can only rate orders that you placed.");
        }
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new InvalidRequestException("You can only rate orders that are completed.");
        }
        if (ratingRepository.existsByOrderIdAndBuyerId(order.getId(), buyer.getId())) {
            throw new ConflictException("You have already rated this order.");
        }


        User farmer = order.getItems().stream().findFirst()
                .orElseThrow(() -> new InvalidRequestException("Order has no items to rate."))
                .getProduct().getFarmer();

        Rating newRating = new Rating();
        newRating.setBuyer(buyer);
        newRating.setOrder(order);
        newRating.setFarmer(farmer);
        newRating.setScore(request.getScore());
        newRating.setComment(request.getComment());
        ratingRepository.save(newRating);

        updateFarmerAverageRating(farmer.getId(), request.getScore());

        return ratingMapper.toRatingResponseDto(newRating);
    }

    private void updateFarmerAverageRating(UUID farmerId, int newScore) {
        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found for rating update."));

        int oldRatingCount = farmer.getRatingCount() != null ? farmer.getRatingCount() : 0;
        BigDecimal oldAverageRating = farmer.getAverageRating() != null ? BigDecimal.valueOf(farmer.getAverageRating()) : BigDecimal.ZERO;

        BigDecimal totalRatingSum = oldAverageRating.multiply(BigDecimal.valueOf(oldRatingCount));
        BigDecimal newTotalRatingSum = totalRatingSum.add(BigDecimal.valueOf(newScore));
        int newRatingCount = oldRatingCount + 1;

        BigDecimal newAverage = newTotalRatingSum.divide(BigDecimal.valueOf(newRatingCount), 2, RoundingMode.HALF_UP);

        farmer.setRatingCount(newRatingCount);
        farmer.setAverageRating(newAverage.doubleValue());
        userRepository.save(farmer);
    }
}