package com.ftb.api.service;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import java.time.LocalDate;
import java.math.BigDecimal;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.InjectMocks;
import com.ftb.api.model.*;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.mapper.CartMapper;
import com.ftb.api.mapper.CartMapperImpl;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.repository.CartRepository;
import com.ftb.api.repository.ProductRepository;
import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.*;
import com.ftb.api.dto.request.UpdateCartRequest;
import com.ftb.api.dto.response.CartResponseDto;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import com.ftb.api.exception.InvalidRequestException;
import com.ftb.api.exception.ResourceNotFoundException;


@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;
    @Spy
    private CartMapper cartMapper = new CartMapperImpl();

    @InjectMocks
    private CartService cartService;

    private static final String EMAIL = "jane@example.com";
    private final User buyer = User.builder().id(UUID.randomUUID()).email(EMAIL).role(UserRole.BUYER).build();
    private final User farmer = User.builder().fullName("Ama Mensah").accountStatus(AccountStatus.ACTIVE).build();
    private Cart cart;

    private Product product(String name, String price, ProductStatus status) {
        return Product.builder()
                .id(UUID.randomUUID())
                .name(name)
                .price(new BigDecimal(price))
                .unit("per kg")
                .harvestDate(LocalDate.now())
                .listingStatus(status)
                .imageUrls(List.of("/a.jpg"))
                .farmer(farmer)
                .build();
    }

    @BeforeEach
    void buyerWithEmptyCart() {
        cart = new Cart();
        cart.setBuyer(buyer);
        lenient().when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(buyer));
        lenient().when(cartRepository.findByBuyerIdWithItems(buyer.getId())).thenReturn(Optional.of(cart));
    }

    private void productExists(Product product) {
        when(productRepository.findWithFarmerAndCategoryById(product.getId())).thenReturn(Optional.of(product));
    }

    @Test
    void addItem_NewProduct_ShouldAddItAtTheCurrentPrice() {
        Product okro = product("Okro", "50.00", ProductStatus.ACTIVE);
        productExists(okro);

        CartResponseDto result = cartService.addItemToCart(EMAIL, new UpdateCartRequest(okro.getId(), 2));

        assertEquals(1, result.getItems().size());
        assertEquals(5000, result.getItems().get(0).getPriceCents());
        assertEquals(10000, result.getItems().get(0).getLineTotalCents());
        assertEquals(2, result.getTotalItems());
        assertEquals(10000, result.getSubtotalCents());
        assertEquals(5000, cart.getItems().get(0).getPriceCentsAtAdd());
        verify(cartRepository).save(cart);
    }

    @Test
    void addItem_ProductAlreadyInCart_ShouldSetQuantityAndRefreshPrice() {
        Product okro = product("Okro", "50.00", ProductStatus.ACTIVE);
        productExists(okro);
        cartService.addItemToCart(EMAIL, new UpdateCartRequest(okro.getId(), 2));
        okro.setPrice(new BigDecimal("45.00"));

        CartResponseDto result = cartService.addItemToCart(EMAIL, new UpdateCartRequest(okro.getId(), 5));

        assertEquals(1, result.getItems().size());
        assertEquals(5, result.getItems().get(0).getQuantity());
        assertEquals(22500, result.getSubtotalCents());
        assertEquals(4500, cart.getItems().get(0).getPriceCentsAtAdd());
    }

    @Test
    void addItem_InactiveProduct_ShouldBeRejectedWithInactiveProductCode() {
        Product soldOut = product("Mango", "10.00", ProductStatus.SOLD_OUT);
        productExists(soldOut);

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> cartService.addItemToCart(EMAIL, new UpdateCartRequest(soldOut.getId(), 1)));

        assertEquals(CartService.INACTIVE_PRODUCT, ex.getCode());
        assertTrue(cart.getItems().isEmpty());
        verify(cartRepository, never()).save(any());
    }

    @Test
    void addItem_ProductOfSuspendedFarmer_ShouldBeRejected() {
        Product product = product("Pepper", "10.00", ProductStatus.ACTIVE);
        product.setFarmer(User.builder().fullName("Suspended").accountStatus(AccountStatus.SUSPENDED).build());
        productExists(product);

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> cartService.addItemToCart(EMAIL, new UpdateCartRequest(product.getId(), 1)));
        assertEquals(CartService.INACTIVE_PRODUCT, ex.getCode());
    }

    @Test
    void addItem_UnknownProduct_ShouldThrowNotFound() {
        UUID id = UUID.randomUUID();
        when(productRepository.findWithFarmerAndCategoryById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> cartService.addItemToCart(EMAIL, new UpdateCartRequest(id, 1)));
    }

    @Test
    void getCart_ShouldFlagItemsNoLongerForSaleAndLeaveThemOutOfTheSubtotal() {
        Product okro = product("Okro", "50.00", ProductStatus.ACTIVE);
        Product mango = product("Mango", "10.00", ProductStatus.ACTIVE);
        productExists(okro);
        productExists(mango);
        cartService.addItemToCart(EMAIL, new UpdateCartRequest(okro.getId(), 1));
        cartService.addItemToCart(EMAIL, new UpdateCartRequest(mango.getId(), 3));
        mango.setListingStatus(ProductStatus.INACTIVE);

        CartResponseDto result = cartService.getCartForBuyer(EMAIL);

        assertTrue(result.getItems().get(0).isAvailable());
        assertFalse(result.getItems().get(1).isAvailable());
        assertEquals(4, result.getTotalItems());
        assertEquals(5000, result.getSubtotalCents());
    }

    @Test
    void getCart_WithoutCart_ShouldCreateAnEmptyOne() {
        when(cartRepository.findByBuyerIdWithItems(buyer.getId())).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartResponseDto result = cartService.getCartForBuyer(EMAIL);

        assertTrue(result.getItems().isEmpty());
        assertEquals(0, result.getSubtotalCents());
        verify(cartRepository).save(argThat(c -> c.getBuyer() == buyer));
    }

    @Test
    void removeItem_ShouldRemoveOnlyThatProduct() {
        Product okro = product("Okro", "50.00", ProductStatus.ACTIVE);
        Product mango = product("Mango", "10.00", ProductStatus.ACTIVE);
        productExists(okro);
        productExists(mango);
        cartService.addItemToCart(EMAIL, new UpdateCartRequest(okro.getId(), 1));
        cartService.addItemToCart(EMAIL, new UpdateCartRequest(mango.getId(), 1));

        CartResponseDto result = cartService.removeItemFromCart(EMAIL, okro.getId());

        assertEquals(List.of("Mango"), result.getItems().stream().map(i -> i.getName()).toList());
    }

    @Test
    void removeItem_NotInCart_ShouldLeaveCartUnchanged() {
        CartResponseDto result = cartService.removeItemFromCart(EMAIL, UUID.randomUUID());

        assertTrue(result.getItems().isEmpty());
    }

    @Test
    void clearCart_ShouldRemoveEverything() {
        Product okro = product("Okro", "50.00", ProductStatus.ACTIVE);
        productExists(okro);
        cartService.addItemToCart(EMAIL, new UpdateCartRequest(okro.getId(), 3));

        CartResponseDto result = cartService.clearCart(EMAIL);

        assertTrue(result.getItems().isEmpty());
        assertEquals(0, result.getTotalItems());
        assertTrue(cart.getItems().isEmpty());
    }
}
