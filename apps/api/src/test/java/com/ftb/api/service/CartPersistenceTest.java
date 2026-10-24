package com.ftb.api.service;

import java.util.List;
import java.time.LocalDate;
import java.math.BigDecimal;
import com.ftb.api.model.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.mapper.CartMapperImpl;
import org.springframework.context.annotation.Import;
import com.ftb.api.dto.request.UpdateCartRequest;
import com.ftb.api.dto.response.CartItemDto;
import com.ftb.api.dto.response.CartResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import static org.junit.jupiter.api.Assertions.*;


/**
 * The cart against real PostgreSQL (DB_URL): it is saved, read back in a fresh persistence context
 * (as when the buyer returns later), keeps items in the order they were added, and deletes removed items.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({CartService.class, CartMapperImpl.class})
class CartPersistenceTest {

    @Autowired
    private CartService cartService;

    @Autowired
    private TestEntityManager entityManager;

    private User buyer;
    private Product okro;
    private Product mango;

    @BeforeEach
    void seed() {
        String suffix = Long.toString(System.nanoTime());
        Category category = entityManager.persist(Category.builder().name("Cart Test " + suffix).build());
        User farmer = entityManager.persist(User.builder().fullName("Farmer").phoneNumber("+23320" + suffix.substring(suffix.length() - 7))
                .passwordHash("x").region("VOLTA").role(UserRole.FARMER).accountStatus(AccountStatus.ACTIVE).build());
        buyer = entityManager.persist(User.builder().fullName("Buyer").email("buyer" + suffix + "@example.com")
                .passwordHash("x").region("VOLTA").role(UserRole.BUYER).accountStatus(AccountStatus.ACTIVE).build());
        okro = entityManager.persist(product("Okro", "50.00", farmer, category));
        mango = entityManager.persist(product("Mango", "10.00", farmer, category));
        entityManager.flush();
    }

    private static Product product(String name, String price, User farmer, Category category) {
        return Product.builder().name(name).price(new BigDecimal(price)).unit("per kg").stockQuantity(0)
                .harvestDate(LocalDate.now()).listingStatus(ProductStatus.ACTIVE).imageUrls(List.of("/a.jpg"))
                .farmer(farmer).category(category).build();
    }

    /** Simulates a later visit: nothing cached from earlier requests. */
    private CartResponseDto reload() {
        entityManager.flush();
        entityManager.clear();
        return cartService.getCartForBuyer(buyer.getEmail());
    }

    @Test
    void cartPersistsAndKeepsItemsInTheOrderAdded() {
        cartService.addItemToCart(buyer.getEmail(), new UpdateCartRequest(mango.getId(), 3));
        cartService.addItemToCart(buyer.getEmail(), new UpdateCartRequest(okro.getId(), 1));
        cartService.addItemToCart(buyer.getEmail(), new UpdateCartRequest(mango.getId(), 4));

        CartResponseDto cart = reload();

        assertEquals(List.of("Mango", "Okro"), cart.getItems().stream().map(CartItemDto::getName).toList());
        assertEquals(4, cart.getItems().get(0).getQuantity());
        assertEquals(5, cart.getTotalItems());
        assertEquals(4 * 1000 + 5000, cart.getSubtotalCents());
    }

    @Test
    void removedAndClearedItemsAreDeleted() {
        cartService.addItemToCart(buyer.getEmail(), new UpdateCartRequest(okro.getId(), 1));
        cartService.addItemToCart(buyer.getEmail(), new UpdateCartRequest(mango.getId(), 1));
        reload();

        cartService.removeItemFromCart(buyer.getEmail(), okro.getId());
        assertEquals(List.of("Mango"), reload().getItems().stream().map(CartItemDto::getName).toList());

        cartService.clearCart(buyer.getEmail());
        assertTrue(reload().getItems().isEmpty());
        Long remaining = entityManager.getEntityManager()
                .createQuery("select count(i) from CartItem i where i.cart.buyer.id = :buyer", Long.class)
                .setParameter("buyer", buyer.getId())
                .getSingleResult();
        assertEquals(0, remaining);
    }
}
