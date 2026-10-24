package com.ftb.api.service;

import java.util.Map;
import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.ftb.api.model.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.mapper.OrderMapperImpl;
import com.ftb.api.mapper.RatingMapperImpl;
import com.ftb.api.mapper.DisputeMapperImpl;
import com.ftb.api.config.DeliveryProperties;
import com.ftb.api.exception.ConflictException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import com.ftb.api.repository.NotificationRepository;
import com.ftb.api.dto.request.CreateRatingRequest;
import com.ftb.api.dto.request.CreateDisputeRequest;
import com.ftb.api.dto.response.OrderConfirmationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import static org.junit.jupiter.api.Assertions.*;


/** Reporting an issue against real PostgreSQL (DB_URL): dispute, order status and admin notification together. */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({DisputeService.class, DisputeMapperImpl.class, AdminNotifier.class, OrderService.class, OrderMapperImpl.class,
        RatingService.class, RatingMapperImpl.class, DeliveryFeeService.class, DisputePersistenceTest.Config.class})
class DisputePersistenceTest {

    @TestConfiguration
    static class Config {
        @Bean
        DeliveryProperties deliveryProperties() {
            return new DeliveryProperties(1000, Map.of());
        }
    }

    @Autowired
    private DisputeService disputeService;
    @Autowired
    private OrderService orderService;
    @Autowired
    private RatingService ratingService;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private TestEntityManager entityManager;

    private User buyer;
    private User farmer;
    private Order order;

    @BeforeEach
    void seed() {
        String suffix = Long.toString(System.nanoTime());
        Category category = entityManager.persist(Category.builder().name("Disputes " + suffix).build());
        farmer = entityManager.persist(User.builder().fullName("Ama").phoneNumber("+23324" + suffix.substring(suffix.length() - 7))
                .passwordHash("x").region("VOLTA").role(UserRole.FARMER).accountStatus(AccountStatus.ACTIVE).build());
        buyer = entityManager.persist(User.builder().fullName("Jane Doe").email("disputer" + suffix + "@example.com")
                .passwordHash("x").region("VOLTA").role(UserRole.BUYER).accountStatus(AccountStatus.ACTIVE).build());
        Product okro = entityManager.persist(Product.builder().name("Okro").price(BigDecimal.TEN).unit("per kg").stockQuantity(0)
                .harvestDate(LocalDate.now()).listingStatus(ProductStatus.ACTIVE).farmer(farmer).category(category).build());
        Order completed = Order.builder().buyer(buyer).orderNumber("CM-D" + suffix.substring(suffix.length() - 7))
                .status(OrderStatus.COMPLETED).paymentStatus(PaymentStatus.UNPAID).fulfillmentType(FulfillmentType.DELIVERY)
                .itemsSubtotal(BigDecimal.TEN).deliveryFee(BigDecimal.ONE).finalTotal(new BigDecimal("11.00")).build();
        completed.setItems(List.of(OrderItem.builder().order(completed).product(okro).quantity(1).priceAtPurchase(BigDecimal.TEN).build()));
        order = entityManager.persist(completed);
        entityManager.flush();
        entityManager.clear();
    }

    private void report(String reason) {
        CreateDisputeRequest request = new CreateDisputeRequest();
        request.setOrderId(order.getId());
        request.setReason(reason);
        disputeService.createDispute(buyer.getEmail(), request);
        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void reportingAnIssueDisputesTheOrderAndNotifiesAdminsTogether() {
        long notificationsBefore = notificationRepository.count();

        report("x".repeat(500));

        OrderConfirmationResponse detail = orderService.getOrderConfirmation(order.getId(), buyer.getEmail());
        assertEquals(OrderStatus.DISPUTED, detail.getStatus());
        assertEquals(DisputeStatus.OPEN, detail.getDispute().getStatus());
        assertEquals(500, detail.getDispute().getReason().length());
        assertEquals(notificationsBefore + 1, notificationRepository.count());
        Notification notification = notificationRepository.findAll().stream()
                .filter(n -> order.getId().equals(n.getOrderId())).findFirst().orElseThrow();
        assertEquals(NotificationType.DISPUTE_OPENED, notification.getType());
        assertTrue(notification.getMessage().startsWith("Issue reported on order " + order.getOrderNumber() + " by Jane Doe"));
    }

    @Test
    void aSecondReportForTheSameOrderIsRejectedAndChangesNothing() {
        report("Rotten okro");

        ConflictException ex = assertThrows(ConflictException.class, () -> report("And again"));

        assertEquals(DisputeService.ALREADY_DISPUTED, ex.getCode());
        assertEquals("Rotten okro", orderService.getOrderConfirmation(order.getId(), buyer.getEmail()).getDispute().getReason());
    }

    @Test
    void anOrderWithoutAReportHasNoDispute() {
        assertNull(orderService.getOrderConfirmation(order.getId(), buyer.getEmail()).getDispute());
    }

    @Test
    void theFarmerCanStillBeRatedAfterAnIssueIsReported() {
        report("Rotten okro");
        CreateRatingRequest rating = new CreateRatingRequest();
        rating.setOrderId(order.getId());
        rating.setFarmerId(farmer.getId());
        rating.setScore(1);

        ratingService.createRating(buyer.getEmail(), rating);
        entityManager.flush();
        entityManager.clear();

        assertEquals(1, entityManager.find(User.class, farmer.getId()).getRatingCount());
    }
}
