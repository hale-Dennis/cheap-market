package com.ftb.api.service;

import java.util.Map;
import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.ftb.api.model.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.mapper.OrderMapperImpl;
import com.ftb.api.mapper.RatingMapperImpl;
import com.ftb.api.config.DeliveryProperties;
import com.ftb.api.exception.ConflictException;
import org.springframework.data.domain.Sort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import com.ftb.api.dto.response.OrderFarmerDto;
import com.ftb.api.dto.request.CreateRatingRequest;
import com.ftb.api.dto.response.OrderSummaryResponseDto;
import com.ftb.api.dto.response.OrderConfirmationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import static org.junit.jupiter.api.Assertions.*;


/** Rating farmers against real PostgreSQL (DB_URL): one rating per farmer per order, and the farmer's average. */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({RatingService.class, RatingMapperImpl.class, OrderService.class, OrderMapperImpl.class,
        DeliveryFeeService.class, AdminNotifier.class, RatingPersistenceTest.Config.class})
class RatingPersistenceTest {

    @TestConfiguration
    static class Config {
        @Bean
        DeliveryProperties deliveryProperties() {
            return new DeliveryProperties(1000, Map.of());
        }
    }

    @Autowired
    private RatingService ratingService;
    @Autowired
    private OrderService orderService;
    @Autowired
    private TestEntityManager entityManager;

    private User buyer;
    private User ama;
    private User kofi;
    private Product okro;
    private Product yam;
    private String suffix;
    private int sequence;

    @BeforeEach
    void seed() {
        suffix = Long.toString(System.nanoTime());
        Category category = entityManager.persist(Category.builder().name("Ratings " + suffix).build());
        ama = entityManager.persist(farmer("Ama", "1"));
        kofi = entityManager.persist(farmer("Kofi", "2"));
        buyer = entityManager.persist(User.builder().fullName("Buyer").email("rater" + suffix + "@example.com")
                .passwordHash("x").region("VOLTA").role(UserRole.BUYER).accountStatus(AccountStatus.ACTIVE).build());
        okro = entityManager.persist(product("Okro", ama, category));
        yam = entityManager.persist(product("Yam", kofi, category));
        entityManager.flush();
    }

    private User farmer(String name, String digit) {
        return User.builder().fullName(name).phoneNumber("+2332" + digit + suffix.substring(suffix.length() - 7))
                .passwordHash("x").region("VOLTA").role(UserRole.FARMER).accountStatus(AccountStatus.ACTIVE).build();
    }

    private static Product product(String name, User farmer, Category category) {
        return Product.builder().name(name).price(BigDecimal.TEN).unit("per kg").stockQuantity(0)
                .harvestDate(LocalDate.now()).listingStatus(ProductStatus.ACTIVE).farmer(farmer).category(category).build();
    }

    private Order order(OrderStatus status, Product... products) {
        Order order = Order.builder().buyer(buyer).orderNumber("CM-R" + String.format("%07d", ++sequence))
                .status(status).paymentStatus(PaymentStatus.UNPAID).fulfillmentType(FulfillmentType.DELIVERY)
                .itemsSubtotal(BigDecimal.TEN).deliveryFee(BigDecimal.ONE).finalTotal(new BigDecimal("11.00")).build();
        order.setItems(java.util.Arrays.stream(products).map(p -> OrderItem.builder()
                .order(order).product(p).quantity(1).priceAtPurchase(BigDecimal.TEN).build()).toList());
        entityManager.persist(order);
        entityManager.flush();
        entityManager.clear();
        return order;
    }

    private void rate(Order order, User farmer, int score, String comment) {
        CreateRatingRequest request = new CreateRatingRequest();
        request.setOrderId(order.getId());
        request.setFarmerId(farmer.getId());
        request.setScore(score);
        request.setComment(comment);
        ratingService.createRating(buyer.getEmail(), request);
        entityManager.flush();
        entityManager.clear();
    }

    private User reload(User user) {
        return entityManager.find(User.class, user.getId());
    }

    @Test
    void eachFarmerInAnOrderIsRatedSeparatelyAndTheirAverageCoversAllOrders() {
        Order first = order(OrderStatus.COMPLETED, okro, yam);
        Order second = order(OrderStatus.COMPLETED, okro);

        rate(first, ama, 5, "Lovely okro");
        rate(first, kofi, 3, null);
        rate(second, ama, 2, "x".repeat(300));

        assertEquals(2, reload(ama).getRatingCount());
        assertEquals(3.5, reload(ama).getAverageRating());
        assertEquals(1, reload(kofi).getRatingCount());
        assertEquals(3.0, reload(kofi).getAverageRating());
        assertEquals(3.5, ratingService.getFarmerRating(ama.getId()).getAverageRating());
    }

    @Test
    void aFarmerCanOnlyBeRatedOncePerOrder() {
        Order completed = order(OrderStatus.COMPLETED, okro);
        rate(completed, ama, 4, null);

        ConflictException ex = assertThrows(ConflictException.class, () -> rate(completed, ama, 1, null));

        assertEquals(RatingService.ALREADY_RATED, ex.getCode());
        assertEquals(1, reload(ama).getRatingCount());
        assertEquals(4.0, reload(ama).getAverageRating());
    }

    @Test
    void theDatabaseRejectsASecondRatingForTheSameOrderAndFarmer() {
        Order completed = order(OrderStatus.COMPLETED, okro);
        Order managed = entityManager.find(Order.class, completed.getId());
        entityManager.persist(Rating.builder().order(managed).buyer(buyer).farmer(reload(ama)).score(5).build());
        entityManager.flush();

        entityManager.persist(Rating.builder().order(managed).buyer(buyer).farmer(reload(ama)).score(1).build());
        assertThrows(org.hibernate.exception.ConstraintViolationException.class, () -> entityManager.flush());
    }

    @Test
    void ordersShowWhichFarmersStillNeedARating() {
        Order completed = order(OrderStatus.COMPLETED, okro, yam);
        Order pending = order(OrderStatus.PENDING, okro);
        rate(completed, ama, 5, "Great");

        List<OrderSummaryResponseDto> summaries = orderService.getOrdersForBuyer(buyer.getEmail(),
                PageRequest.of(0, 10, Sort.by(Sort.Order.desc("createdAt")))).getContent();
        OrderSummaryResponseDto completedRow = summaries.stream().filter(s -> s.getId().equals(completed.getId())).findFirst().orElseThrow();
        OrderSummaryResponseDto pendingRow = summaries.stream().filter(s -> s.getId().equals(pending.getId())).findFirst().orElseThrow();
        assertEquals(List.of(kofi.getId()), completedRow.getFarmersToRate().stream().map(OrderFarmerDto::getFarmerId).toList());
        assertEquals("Kofi", completedRow.getFarmersToRate().get(0).getFullName());
        assertTrue(pendingRow.getFarmersToRate().isEmpty());

        OrderConfirmationResponse detail = orderService.getOrderConfirmation(completed.getId(), buyer.getEmail());
        OrderFarmerDto amaRow = detail.getFarmers().stream().filter(f -> f.getFarmerId().equals(ama.getId())).findFirst().orElseThrow();
        OrderFarmerDto kofiRow = detail.getFarmers().stream().filter(f -> f.getFarmerId().equals(kofi.getId())).findFirst().orElseThrow();
        assertEquals(2, detail.getFarmers().size());
        assertEquals(5, amaRow.getRating().getScore());
        assertEquals("Great", amaRow.getRating().getComment());
        assertNull(kofiRow.getRating());
    }
}
