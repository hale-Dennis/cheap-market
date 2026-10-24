package com.ftb.api.service;

import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.math.BigDecimal;
import com.ftb.api.model.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.mapper.CartMapperImpl;
import com.ftb.api.mapper.OrderMapperImpl;
import com.ftb.api.config.DeliveryProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import com.ftb.api.dto.request.PlaceOrderRequest;
import com.ftb.api.dto.request.UpdateCartRequest;
import com.ftb.api.dto.response.OrderConfirmationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import static org.junit.jupiter.api.Assertions.*;


/**
 * Placing an order against real PostgreSQL (DB_URL): the order, its items, the emptied cart and the admin
 * notification are saved together, and the database enforces one order per buyer per idempotency key.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({OrderService.class, OrderMapperImpl.class, com.ftb.api.mapper.RatingMapperImpl.class, com.ftb.api.mapper.DisputeMapperImpl.class, CartService.class, CartMapperImpl.class,
        DeliveryFeeService.class, AdminNotifier.class, OrderPlacementPersistenceTest.Config.class})
class OrderPlacementPersistenceTest {

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
    private CartService cartService;
    @Autowired
    private TestEntityManager entityManager;

    private User buyer;
    private Product okro;

    @BeforeEach
    void seed() {
        String suffix = Long.toString(System.nanoTime());
        Category category = entityManager.persist(Category.builder().name("Order Test " + suffix).build());
        User farmer = entityManager.persist(User.builder().fullName("Farmer").phoneNumber("+23320" + suffix.substring(suffix.length() - 7))
                .passwordHash("x").region("VOLTA").role(UserRole.FARMER).accountStatus(AccountStatus.ACTIVE).build());
        buyer = entityManager.persist(User.builder().fullName("Jane Doe").email("order" + suffix + "@example.com")
                .passwordHash("x").region("VOLTA").role(UserRole.BUYER).accountStatus(AccountStatus.ACTIVE)
                .deliveryAddress(new Address("12 Ring Rd", "Ho", null)).build());
        okro = entityManager.persist(Product.builder().name("Okro").price(new BigDecimal("50.00")).unit("per kg")
                .stockQuantity(0).harvestDate(LocalDate.now()).listingStatus(ProductStatus.ACTIVE)
                .imageUrls(List.of("/a.jpg")).farmer(farmer).category(category).build());
        entityManager.flush();
        cartService.addItemToCart(buyer.getEmail(), new UpdateCartRequest(okro.getId(), 2));
        entityManager.flush();
        entityManager.clear();
    }

    private static PlaceOrderRequest delivery() {
        PlaceOrderRequest request = new PlaceOrderRequest();
        request.setFulfillmentType(FulfillmentType.DELIVERY);
        return request;
    }

    @Test
    void placesAPendingOrderEmptiesTheCartAndNotifiesAdmins() {
        OrderService.PlacedOrder placed = orderService.placeOrder(buyer.getEmail(), delivery(), "key-persist-1");
        entityManager.flush();
        entityManager.clear();

        OrderConfirmationResponse order = orderService.getOrderConfirmation(placed.orderId(), buyer.getEmail());
        assertEquals(placed.orderNumber(), order.getOrderNumber());
        assertEquals(OrderStatus.PENDING, order.getStatus());
        assertEquals(1, order.getItems().size());
        assertEquals(10000, order.getItemsSubtotalCents());
        assertEquals(1000, order.getDeliveryFeeCents());
        assertEquals(11000, order.getFinalTotalCents());
        assertEquals("Ho", order.getDeliveryAddress().getTown());
        assertNotNull(order.getCreatedAt());

        assertTrue(cartService.getCartForBuyer(buyer.getEmail()).getItems().isEmpty());
        List<Notification> notifications = entityManager.getEntityManager()
                .createQuery("select n from Notification n where n.orderId = :id", Notification.class)
                .setParameter("id", placed.orderId()).getResultList();
        assertEquals(1, notifications.size());
        assertTrue(notifications.get(0).getMessage().startsWith("New order " + placed.orderNumber() + " from Jane Doe"));
    }

    @Test
    void repeatingTheRequestReturnsTheSameOrder() {
        OrderService.PlacedOrder first = orderService.placeOrder(buyer.getEmail(), delivery(), "key-persist-2");
        entityManager.flush();

        OrderService.PlacedOrder second = orderService.placeOrder(buyer.getEmail(), delivery(), "key-persist-2");

        assertTrue(second.duplicate());
        assertEquals(first.orderId(), second.orderId());
        Long orders = entityManager.getEntityManager()
                .createQuery("select count(o) from Order o where o.buyer.id = :buyer", Long.class)
                .setParameter("buyer", buyer.getId()).getSingleResult();
        assertEquals(1, orders);
    }

    @Test
    void theDatabaseRejectsASecondOrderWithTheSameKey() {
        orderService.placeOrder(buyer.getEmail(), delivery(), "key-persist-3");
        entityManager.flush();

        Order copy = Order.builder().buyer(entityManager.find(User.class, buyer.getId())).orderNumber("CM-TESTCOPY")
                .idempotencyKey("key-persist-3").status(OrderStatus.PENDING).paymentStatus(PaymentStatus.UNPAID)
                .fulfillmentType(FulfillmentType.DELIVERY).itemsSubtotal(BigDecimal.ONE).deliveryFee(BigDecimal.ZERO)
                .finalTotal(BigDecimal.ONE).build();

        assertThrows(Exception.class, () -> entityManager.persistAndFlush(copy));
    }
}
