package com.ftb.api.service;

import java.util.List;
import java.util.Map;
import java.time.Instant;
import java.time.LocalDate;
import java.math.BigDecimal;
import com.ftb.api.model.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.mapper.OrderMapperImpl;
import com.ftb.api.config.DeliveryProperties;
import org.springframework.data.domain.Sort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.dto.response.OrderSummaryResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import static org.junit.jupiter.api.Assertions.*;


/** The buyer's order history against real PostgreSQL (DB_URL), including the computed item count. */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({OrderService.class, OrderMapperImpl.class, DeliveryFeeService.class, AdminNotifier.class,
        OrderHistoryQueryTest.Config.class})
class OrderHistoryQueryTest {

    private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));

    @TestConfiguration
    static class Config {
        @Bean
        DeliveryProperties deliveryProperties() {
            return new DeliveryProperties(1000, Map.of());
        }
    }

    @Autowired
    private OrderService orderService;
    @Autowired
    private TestEntityManager entityManager;

    private User buyer;
    private User otherBuyer;
    private Product okro;
    private int sequence;

    @BeforeEach
    void seed() {
        String suffix = Long.toString(System.nanoTime());
        Category category = entityManager.persist(Category.builder().name("History " + suffix).build());
        User farmer = entityManager.persist(User.builder().fullName("Farmer").phoneNumber("+23320" + suffix.substring(suffix.length() - 7))
                .passwordHash("x").region("VOLTA").role(UserRole.FARMER).accountStatus(AccountStatus.ACTIVE).build());
        buyer = entityManager.persist(buyer("history" + suffix + "@example.com"));
        otherBuyer = entityManager.persist(buyer("other" + suffix + "@example.com"));
        okro = entityManager.persist(Product.builder().name("Okro").price(new BigDecimal("10.00")).unit("per kg")
                .stockQuantity(0).harvestDate(LocalDate.now()).listingStatus(ProductStatus.ACTIVE)
                .farmer(farmer).category(category).build());
        entityManager.flush();
    }

    private static User buyer(String email) {
        return User.builder().fullName("Buyer").email(email).passwordHash("x").region("VOLTA")
                .role(UserRole.BUYER).accountStatus(AccountStatus.ACTIVE).build();
    }

    /** Persists an order whose items total {@code quantities}, created {@code minutesAgo} ago. */
    private Order order(User owner, int minutesAgo, OrderStatus status, int... quantities) {
        Order order = Order.builder()
                .buyer(owner)
                .orderNumber("CM-T" + String.format("%07d", ++sequence))
                .status(status)
                .paymentStatus(PaymentStatus.UNPAID)
                .fulfillmentType(FulfillmentType.DELIVERY)
                .itemsSubtotal(BigDecimal.TEN)
                .deliveryFee(BigDecimal.ONE)
                .finalTotal(new BigDecimal("11.00"))
                .build();
        order.setItems(java.util.Arrays.stream(quantities).mapToObj(q -> OrderItem.builder()
                .order(order).product(okro).quantity(q).priceAtPurchase(BigDecimal.TEN).build()).toList());
        entityManager.persist(order);
        entityManager.flush();
        // createdAt is set by Hibernate on insert; backdate it so ordering is deterministic.
        entityManager.getEntityManager()
                .createQuery("update Order o set o.createdAt = :at where o.id = :id")
                .setParameter("at", Instant.now().minusSeconds(60L * minutesAgo))
                .setParameter("id", order.getId())
                .executeUpdate();
        return order;
    }

    private PaginatedResponse<OrderSummaryResponseDto> page(User owner, int page) {
        entityManager.clear();
        return orderService.getOrdersForBuyer(owner.getEmail(), PageRequest.of(page, 10, NEWEST_FIRST));
    }

    @Test
    void returnsOnlyTheBuyersOrdersNewestFirstWithItemCounts() {
        Order older = order(buyer, 60, OrderStatus.COMPLETED, 2, 3);
        Order newer = order(buyer, 5, OrderStatus.PENDING, 1);
        order(otherBuyer, 1, OrderStatus.PENDING, 4);

        List<OrderSummaryResponseDto> orders = page(buyer, 0).getContent();

        assertEquals(List.of(newer.getId(), older.getId()), orders.stream().map(OrderSummaryResponseDto::getId).toList());
        assertEquals(1, orders.get(0).getItemCount());
        assertEquals(5, orders.get(1).getItemCount());
        assertEquals(OrderStatus.COMPLETED, orders.get(1).getStatus());
        assertEquals(older.getOrderNumber(), orders.get(1).getOrderNumber());
        assertEquals(1100, orders.get(1).getFinalTotalCents());
        assertEquals(FulfillmentType.DELIVERY, orders.get(1).getFulfillmentType());
    }

    @Test
    void paginatesTenPerPageAcrossMoreThanThreePages() {
        for (int i = 1; i <= 25; i++) {
            order(buyer, i, OrderStatus.PENDING, 1);
        }

        PaginatedResponse<OrderSummaryResponseDto> first = page(buyer, 0);
        PaginatedResponse<OrderSummaryResponseDto> third = page(buyer, 2);

        assertEquals(10, first.getContent().size());
        assertEquals(25, first.getTotalElements());
        assertEquals(3, first.getTotalPages());
        assertEquals(5, third.getContent().size());
        assertTrue(page(buyer, 3).getContent().isEmpty());
    }

    @Test
    void buyerWithoutOrdersGetsAnEmptyPage() {
        PaginatedResponse<OrderSummaryResponseDto> result = page(otherBuyer, 0);

        assertTrue(result.getContent().isEmpty());
        assertEquals(0, result.getTotalElements());
    }
}
