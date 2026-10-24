package com.ftb.api.service;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import com.ftb.api.model.*;
import org.mockito.Spy;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.mapper.RatingMapper;
import com.ftb.api.mapper.RatingMapperImpl;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.repository.OrderRepository;
import com.ftb.api.repository.RatingRepository;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.dto.response.RatingResponseDto;
import com.ftb.api.dto.request.CreateRatingRequest;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import com.ftb.api.exception.InvalidRequestException;
import com.ftb.api.exception.ResourceNotFoundException;
import com.ftb.api.dto.response.FarmerRatingSummaryDto;
import org.springframework.dao.DataIntegrityViolationException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
class RatingServiceTest {

    @Mock
    private RatingRepository ratingRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private UserRepository userRepository;
    @Spy
    private RatingMapper ratingMapper = new RatingMapperImpl();

    @InjectMocks
    private RatingService ratingService;

    private static final String EMAIL = "jane@example.com";
    private final User buyer = User.builder().id(UUID.randomUUID()).email(EMAIL).role(UserRole.BUYER).build();
    private final User ama = farmer("Ama");
    private final User kofi = farmer("Kofi");
    private Order order;

    private static User farmer(String name) {
        return User.builder().id(UUID.randomUUID()).fullName(name).role(UserRole.FARMER).build();
    }

    private static OrderItem item(User farmer) {
        return OrderItem.builder().quantity(1).product(Product.builder().id(UUID.randomUUID()).farmer(farmer).build()).build();
    }

    @BeforeEach
    void setUp() {
        order = Order.builder().id(UUID.randomUUID()).buyer(buyer).status(OrderStatus.COMPLETED)
                .items(List.of(item(ama), item(kofi))).build();
    }

    private CreateRatingRequest request(User farmer, int score, String comment) {
        CreateRatingRequest request = new CreateRatingRequest();
        request.setOrderId(order.getId());
        request.setFarmerId(farmer.getId());
        request.setScore(score);
        request.setComment(comment);
        return request;
    }

    private void orderFound() {
        when(orderRepository.findWithDetailsById(order.getId())).thenReturn(Optional.of(order));
    }

    @Test
    void createRating_SavesItAndRecalculatesTheFarmersAverageFromAllRatings() {
        orderFound();
        when(userRepository.lockById(kofi.getId())).thenReturn(Optional.of(kofi));
        when(ratingRepository.countByFarmerId(kofi.getId())).thenReturn(3L);
        when(ratingRepository.averageScoreByFarmerId(kofi.getId())).thenReturn(11 / 3.0);

        RatingResponseDto result = ratingService.createRating(EMAIL, request(kofi, 4, "  Fresh yams  "));

        assertEquals(4, result.getScore());
        assertEquals("Fresh yams", result.getComment());
        assertEquals(kofi.getId(), result.getFarmerId());
        assertEquals(order.getId(), result.getOrderId());
        assertEquals(3, kofi.getRatingCount());
        assertEquals(3.67, kofi.getAverageRating());
        verify(ratingRepository).saveAndFlush(any(Rating.class));
        verify(userRepository).save(kofi);
    }

    @Test
    void createRating_BlankCommentIsStoredAsNull() {
        orderFound();
        when(userRepository.lockById(ama.getId())).thenReturn(Optional.of(ama));
        when(ratingRepository.countByFarmerId(ama.getId())).thenReturn(1L);
        when(ratingRepository.averageScoreByFarmerId(ama.getId())).thenReturn(5.0);

        assertNull(ratingService.createRating(EMAIL, request(ama, 5, "   ")).getComment());
    }

    @Test
    void createRating_SomeoneElsesOrder_IsNotFound() {
        order.setBuyer(User.builder().id(UUID.randomUUID()).email("other@example.com").build());
        orderFound();

        assertThrows(ResourceNotFoundException.class, () -> ratingService.createRating(EMAIL, request(ama, 5, null)));
        verify(ratingRepository, never()).saveAndFlush(any());
    }

    @Test
    void createRating_OrderNotCompleted_Returns422Code() {
        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        orderFound();

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> ratingService.createRating(EMAIL, request(ama, 5, null)));
        assertEquals(RatingService.ORDER_NOT_COMPLETED, ex.getCode());
    }

    @Test
    void createRating_FarmerNotInTheOrder_Returns422Code() {
        orderFound();

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> ratingService.createRating(EMAIL, request(farmer("Yaw"), 5, null)));
        assertEquals(RatingService.FARMER_NOT_IN_ORDER, ex.getCode());
    }

    @Test
    void createRating_AlreadyRated_Returns409Code() {
        orderFound();
        when(userRepository.lockById(ama.getId())).thenReturn(Optional.of(ama));
        when(ratingRepository.existsByOrderIdAndFarmerId(order.getId(), ama.getId())).thenReturn(true);

        ConflictException ex = assertThrows(ConflictException.class,
                () -> ratingService.createRating(EMAIL, request(ama, 5, null)));
        assertEquals(RatingService.ALREADY_RATED, ex.getCode());
        verify(ratingRepository, never()).saveAndFlush(any());
    }

    @Test
    void createRating_SimultaneousDuplicateHitsTheUniqueConstraint_Returns409Code() {
        orderFound();
        when(userRepository.lockById(ama.getId())).thenReturn(Optional.of(ama));
        when(ratingRepository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("uk_ratings_order_farmer"));

        ConflictException ex = assertThrows(ConflictException.class,
                () -> ratingService.createRating(EMAIL, request(ama, 5, null)));
        assertEquals(RatingService.ALREADY_RATED, ex.getCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    void getFarmerRating_ReturnsAverageAndCount() {
        when(userRepository.existsByIdAndRole(ama.getId(), UserRole.FARMER)).thenReturn(true);
        when(ratingRepository.countByFarmerId(ama.getId())).thenReturn(2L);
        when(ratingRepository.averageScoreByFarmerId(ama.getId())).thenReturn(4.5);

        FarmerRatingSummaryDto result = ratingService.getFarmerRating(ama.getId());

        assertEquals(4.5, result.getAverageRating());
        assertEquals(2, result.getRatingCount());
    }

    @Test
    void getFarmerRating_Unrated_HasNullAverage() {
        when(userRepository.existsByIdAndRole(ama.getId(), UserRole.FARMER)).thenReturn(true);

        FarmerRatingSummaryDto result = ratingService.getFarmerRating(ama.getId());

        assertNull(result.getAverageRating());
        assertEquals(0, result.getRatingCount());
    }

    @Test
    void getFarmerRating_UnknownFarmer_IsNotFound() {
        assertThrows(ResourceNotFoundException.class, () -> ratingService.getFarmerRating(UUID.randomUUID()));
    }
}
