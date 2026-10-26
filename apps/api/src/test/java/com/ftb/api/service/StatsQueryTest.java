package com.ftb.api.service;

import java.util.List;
import java.time.LocalDate;
import java.math.BigDecimal;
import com.ftb.api.model.*;
import org.junit.jupiter.api.Test;
import com.ftb.api.dto.response.AdminStatsResponse;
import com.ftb.api.dto.response.PublicStatsResponse;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import static org.junit.jupiter.api.Assertions.assertEquals;


/**
 * Runs the stats queries against the real PostgreSQL database (DB_URL). The database may already
 * hold data, so each test checks how the counts change. Each test rolls back.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(StatsService.class)
class StatsQueryTest {

    @Autowired
    private StatsService statsService;

    @Autowired
    private TestEntityManager entityManager;

    private int sequence;

    private User farmer(String region, AccountStatus status) {
        return entityManager.persist(User.builder()
                .fullName("Stats Farmer " + (++sequence))
                .phoneNumber("+23324" + String.format("%07d", (System.nanoTime() + sequence) % 10_000_000))
                .passwordHash("x")
                .region(region)
                .role(UserRole.FARMER)
                .accountStatus(status)
                .build());
    }

    private Product listing(User farmer, Category category, ProductStatus status) {
        return entityManager.persist(Product.builder().name("Stats Okro").price(BigDecimal.TEN).unit("per kg")
                .stockQuantity(0).harvestDate(LocalDate.now()).listingStatus(status)
                .farmer(farmer).category(category).build());
    }

    private Order order(User buyer, OrderStatus status) {
        return entityManager.persist(Order.builder()
                .buyer(buyer)
                .orderNumber("CM-S" + String.format("%07d", (System.nanoTime() + (++sequence)) % 10_000_000))
                .status(status)
                .paymentStatus(PaymentStatus.UNPAID)
                .fulfillmentType(FulfillmentType.DELIVERY)
                .itemsSubtotal(BigDecimal.TEN)
                .deliveryFee(BigDecimal.ONE)
                .finalTotal(new BigDecimal("11.00"))
                .build());
    }

    @Test
    void adminStats_ShouldCountFarmersLiveListingsOrdersInProgressAndOpenDisputes() {
        AdminStatsResponse before = statsService.getAdminStats();
        Category category = entityManager.persist(Category.builder().name("Stats " + System.nanoTime()).build());
        User active = farmer("VOLTA", AccountStatus.ACTIVE);
        User suspended = farmer("VOLTA", AccountStatus.SUSPENDED);
        listing(active, category, ProductStatus.ACTIVE);
        listing(active, category, ProductStatus.INACTIVE);
        listing(suspended, category, ProductStatus.ACTIVE);
        User buyer = entityManager.persist(User.builder().fullName("Stats Buyer").email("stats" + System.nanoTime() + "@example.com")
                .passwordHash("x").region("VOLTA").role(UserRole.BUYER).accountStatus(AccountStatus.ACTIVE).build());
        order(buyer, OrderStatus.PENDING);
        order(buyer, OrderStatus.OUT_FOR_DELIVERY);
        order(buyer, OrderStatus.COMPLETED);
        for (DisputeStatus status : List.of(DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, DisputeStatus.RESOLVED)) {
            entityManager.persist(Dispute.builder().order(order(buyer, OrderStatus.DISPUTED)).reason("Missing items").status(status).build());
        }
        entityManager.flush();

        AdminStatsResponse after = statsService.getAdminStats();

        assertEquals(2, after.farmers() - before.farmers());
        assertEquals(1, after.liveListings() - before.liveListings());
        assertEquals(2, after.ordersInProgress() - before.ordersInProgress());
        assertEquals(2, after.openDisputes() - before.openDisputes());
    }

    @Test
    void publicStats_ShouldCountActiveFarmersAndRegionsWithLiveListings() {
        Category category = entityManager.persist(Category.builder().name("Stats " + System.nanoTime()).build());
        // A region that may be empty in the shared database: only listings added here can change its count.
        PublicStatsResponse before = statsService.getPublicStats();
        boolean savannahHadListings = !entityManager.getEntityManager()
                .createQuery("select p.id from Product p where p.farmer.region = 'SAVANNAH' and p.listingStatus = :active"
                        + " and p.farmer.accountStatus = :ok")
                .setParameter("active", ProductStatus.ACTIVE).setParameter("ok", AccountStatus.ACTIVE)
                .setMaxResults(1).getResultList().isEmpty();

        User savannah = farmer("SAVANNAH", AccountStatus.ACTIVE);
        listing(savannah, category, ProductStatus.ACTIVE);
        listing(farmer("SAVANNAH", AccountStatus.ACTIVE), category, ProductStatus.ACTIVE);
        farmer("OTI", AccountStatus.SUSPENDED);
        entityManager.flush();

        PublicStatsResponse after = statsService.getPublicStats();

        assertEquals(2, after.farmers() - before.farmers());
        assertEquals(savannahHadListings ? 0 : 1, after.regions() - before.regions());
    }
}
