package com.ftb.api.service;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import java.time.LocalDate;
import java.math.BigDecimal;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import com.ftb.api.model.*;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.mapper.OrderMapper;
import com.ftb.api.mapper.OrderMapperImpl;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.repository.CartRepository;
import com.ftb.api.repository.OrderRepository;
import com.ftb.api.repository.PickupLocationRepository;
import com.ftb.api.repository.RatingRepository;
import com.ftb.api.repository.OrderItemRepository;
import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.*;
import com.ftb.api.dto.request.PlaceOrderRequest;
import com.ftb.api.exception.BadRequestException;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import com.ftb.api.exception.InvalidRequestException;
import com.ftb.api.exception.ResourceNotFoundException;


@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PickupLocationRepository pickupLocationRepository;
    @Spy
    private OrderMapper orderMapper = new OrderMapperImpl();
    @Mock
    private DeliveryFeeService deliveryFeeService;
    @Mock
    private AdminNotifier adminNotifier;
    @Mock
    private RatingRepository ratingRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Spy
    private com.ftb.api.mapper.RatingMapper ratingMapper = new com.ftb.api.mapper.RatingMapperImpl();
    @Mock
    private com.ftb.api.repository.DisputeRepository disputeRepository;
    @Spy
    private com.ftb.api.mapper.DisputeMapper disputeMapper = new com.ftb.api.mapper.DisputeMapperImpl();

    @InjectMocks
    private OrderService orderService;

    private static final String EMAIL = "jane@example.com";
    private final User buyer = User.builder().id(UUID.randomUUID()).email(EMAIL).fullName("Jane Doe")
            .region("VOLTA").role(UserRole.BUYER)
            .deliveryAddress(new Address("12 Ring Rd", "Ho", "VH-123-4567")).build();
    private final User farmer = User.builder().fullName("Ama").accountStatus(AccountStatus.ACTIVE).build();
    private Cart cart;
    private Product okro;

    private Product product(String name, String price) {
        return Product.builder().id(UUID.randomUUID()).name(name).price(new BigDecimal(price)).unit("per kg")
                .harvestDate(LocalDate.now()).listingStatus(ProductStatus.ACTIVE).farmer(farmer).build();
    }

    private void addToCart(Product product, int quantity, int storedPriceCents) {
        CartItem item = new CartItem();
        item.setProduct(product);
        item.setQuantity(quantity);
        item.setPriceCentsAtAdd(storedPriceCents);
        cart.addItem(item);
    }

    private static PlaceOrderRequest request(FulfillmentType type, UUID pickupLocationId) {
        PlaceOrderRequest request = new PlaceOrderRequest();
        request.setFulfillmentType(type);
        request.setPickupLocationId(pickupLocationId);
        return request;
    }

    @BeforeEach
    void buyerWithCart() {
        cart = new Cart();
        cart.setBuyer(buyer);
        okro = product("Okro", "50.00");
        lenient().when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(buyer));
        lenient().when(cartRepository.findByBuyerIdWithItems(buyer.getId())).thenReturn(Optional.of(cart));
        lenient().when(orderRepository.saveAndFlush(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(UUID.randomUUID());
            return order;
        });
        lenient().when(deliveryFeeService.feeFor("VOLTA")).thenReturn(new BigDecimal("10.00"));
    }

    private Order savedOrder() {
        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).saveAndFlush(captor.capture());
        return captor.getValue();
    }

    @Test
    void homeDelivery_ShouldCreatePendingOrderAtCurrentPricesWithFeeAndNotifyAdmins() {
        addToCart(okro, 2, 4000); // price has risen since it was added
        addToCart(product("Mango", "12.50"), 1, 1250);

        OrderService.PlacedOrder placed = orderService.placeOrder(EMAIL, request(FulfillmentType.DELIVERY, null), "key-12345678");

        Order order = savedOrder();
        assertFalse(placed.duplicate());
        assertEquals(order.getId(), placed.orderId());
        assertTrue(placed.orderNumber().matches("^CM-[0-9A-HJKMNP-TV-Z]{8}$"), placed.orderNumber());
        assertEquals(OrderStatus.PENDING, order.getStatus());
        assertEquals(PaymentStatus.UNPAID, order.getPaymentStatus());
        assertEquals("key-12345678", order.getIdempotencyKey());
        assertEquals(new BigDecimal("50.00"), order.getItems().get(0).getPriceAtPurchase());
        assertEquals(new BigDecimal("112.50"), order.getItemsSubtotal());
        assertEquals(new BigDecimal("10.00"), order.getDeliveryFee());
        assertEquals(new BigDecimal("122.50"), order.getFinalTotal());
        assertEquals(new Address("12 Ring Rd", "Ho", "VH-123-4567"), order.getDeliveryAddress());
        assertNotSame(buyer.getDeliveryAddress(), order.getDeliveryAddress());
        assertNull(order.getPickupLocation());
        assertTrue(cart.getItems().isEmpty());
        verify(adminNotifier).notifyNewOrder(eq(order.getId()),
                eq("New order " + order.getOrderNumber() + " from Jane Doe: 3 items, GH₵ 122.50, home delivery to Ho."));
    }

    @Test
    void pickup_ShouldBeFreeAndUseTheChosenLocationInTheBuyersRegion() {
        addToCart(okro, 1, 5000);
        PickupLocation ho = PickupLocation.builder().id(UUID.randomUUID()).name("Ho Market").region("VOLTA").build();
        when(pickupLocationRepository.findById(ho.getId())).thenReturn(Optional.of(ho));

        orderService.placeOrder(EMAIL, request(FulfillmentType.PICKUP, ho.getId()), null);

        Order order = savedOrder();
        assertSame(ho, order.getPickupLocation());
        assertEquals(BigDecimal.ZERO, order.getDeliveryFee());
        assertEquals(new BigDecimal("50.00"), order.getFinalTotal());
        assertNull(order.getDeliveryAddress());
        assertNull(order.getIdempotencyKey());
        verify(deliveryFeeService, never()).feeFor(any());
    }

    @Test
    void emptyCart_ShouldBeRejectedWithEmptyCartCode() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> orderService.placeOrder(EMAIL, request(FulfillmentType.DELIVERY, null), null));

        assertEquals(OrderService.EMPTY_CART, ex.getCode());
        verify(orderRepository, never()).saveAndFlush(any());
    }

    @Test
    void buyerWithoutACart_ShouldBeRejectedWithEmptyCartCode() {
        when(cartRepository.findByBuyerIdWithItems(buyer.getId())).thenReturn(Optional.empty());

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> orderService.placeOrder(EMAIL, request(FulfillmentType.DELIVERY, null), null));
        assertEquals(OrderService.EMPTY_CART, ex.getCode());
    }

    @Test
    void unavailableItems_ShouldBeRejectedAndNamed() {
        addToCart(okro, 1, 5000);
        Product mango = product("Mango", "12.50");
        mango.setListingStatus(ProductStatus.SOLD_OUT);
        addToCart(mango, 1, 1250);

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> orderService.placeOrder(EMAIL, request(FulfillmentType.DELIVERY, null), null));

        assertEquals(OrderService.UNAVAILABLE_ITEMS, ex.getCode());
        assertTrue(ex.getMessage().contains("Mango"));
        assertEquals(2, cart.getItems().size());
        verifyNoInteractions(adminNotifier);
    }

    @Test
    void pickupWithoutLocation_ShouldBeRejected() {
        addToCart(okro, 1, 5000);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> orderService.placeOrder(EMAIL, request(FulfillmentType.PICKUP, null), null));
        assertEquals(OrderService.PICKUP_LOCATION_REQUIRED, ex.getCode());
    }

    @Test
    void pickupInAnotherRegion_ShouldBeRejected() {
        addToCart(okro, 1, 5000);
        PickupLocation kumasi = PickupLocation.builder().id(UUID.randomUUID()).name("Kejetia").region("ASHANTI").build();
        when(pickupLocationRepository.findById(kumasi.getId())).thenReturn(Optional.of(kumasi));

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> orderService.placeOrder(EMAIL, request(FulfillmentType.PICKUP, kumasi.getId()), null));
        assertEquals(OrderService.PICKUP_LOCATION_OUT_OF_REGION, ex.getCode());
    }

    @Test
    void unknownPickupLocation_ShouldThrowNotFound() {
        addToCart(okro, 1, 5000);
        UUID id = UUID.randomUUID();
        when(pickupLocationRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> orderService.placeOrder(EMAIL, request(FulfillmentType.PICKUP, id), null));
    }

    @Test
    void deliveryWithoutAddress_ShouldBeRejected() {
        buyer.setDeliveryAddress(null);
        addToCart(okro, 1, 5000);

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> orderService.placeOrder(EMAIL, request(FulfillmentType.DELIVERY, null), null));
        assertEquals(OrderService.DELIVERY_ADDRESS_REQUIRED, ex.getCode());
    }

    @Test
    void repeatedRequestWithTheSameKey_ShouldReturnTheOriginalOrderWithoutCreatingAnother() {
        Order original = Order.builder().id(UUID.randomUUID()).orderNumber("CM-ABCDEFGH").build();
        when(orderRepository.findByBuyerIdAndIdempotencyKey(buyer.getId(), "key-12345678")).thenReturn(Optional.of(original));

        OrderService.PlacedOrder placed = orderService.placeOrder(EMAIL, request(FulfillmentType.DELIVERY, null), "key-12345678");

        assertTrue(placed.duplicate());
        assertEquals(original.getId(), placed.orderId());
        assertEquals("CM-ABCDEFGH", placed.orderNumber());
        verify(orderRepository, never()).saveAndFlush(any());
        verifyNoInteractions(cartRepository, adminNotifier);
    }

    @Test
    void orderNumberCollision_ShouldBeRetried() {
        addToCart(okro, 1, 5000);
        when(orderRepository.existsByOrderNumber(any())).thenReturn(true, false);

        orderService.placeOrder(EMAIL, request(FulfillmentType.DELIVERY, null), null);

        verify(orderRepository, times(2)).existsByOrderNumber(any());
    }

    @Test
    void confirmation_ForAnotherBuyersOrder_ShouldBeNotFound() {
        Order order = Order.builder().id(UUID.randomUUID())
                .buyer(User.builder().email("someone@else.com").build()).items(List.of()).build();
        when(orderRepository.findWithDetailsById(order.getId())).thenReturn(Optional.of(order));

        assertThrows(ResourceNotFoundException.class, () -> orderService.getOrderConfirmation(order.getId(), EMAIL));
    }
}
