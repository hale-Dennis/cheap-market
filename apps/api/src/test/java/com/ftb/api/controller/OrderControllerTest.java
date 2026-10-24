package com.ftb.api.controller;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import java.time.Instant;
import com.ftb.api.model.*;
import org.junit.jupiter.api.Test;
import com.ftb.api.service.JwtService;
import com.ftb.api.service.OrderService;
import com.ftb.api.service.AdminNotifier;
import com.ftb.api.config.SecurityConfig;
import org.springframework.http.MediaType;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.config.JwtAuthenticationFilter;
import com.ftb.api.config.CustomAccessDeniedHandler;
import com.ftb.api.config.CustomAuthenticationEntryPoint;
import com.ftb.api.dto.response.OrderItemDto;
import com.ftb.api.dto.request.PlaceOrderRequest;
import com.ftb.api.exception.BadRequestException;
import com.ftb.api.exception.ResourceNotFoundException;
import com.ftb.api.dto.response.OrderConfirmationResponse;
import com.ftb.api.dto.response.AdminNotificationsResponse;
import com.ftb.api.dto.response.NotificationResponse;
import com.ftb.api.controller.admin.AdminNotificationController;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


@WebMvcTest(controllers = {OrderController.class, AdminNotificationController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "application.security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw",
        "application.security.jwt.expiration=3600000"
})
@WithMockUser(username = "jane@example.com", roles = "BUYER")
class OrderControllerTest {

    private static final String EMAIL = "jane@example.com";
    private static final String KEY = "checkout-2f8c1d6e";
    private static final UUID ORDER = UUID.randomUUID();
    private static final String DELIVERY = "{\"fulfillmentType\":\"DELIVERY\"}";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OrderService orderService;

    @MockitoBean
    private AdminNotifier adminNotifier;

    @MockitoBean
    private UserRepository userRepository;

    private org.springframework.test.web.servlet.ResultActions placeOrder(String body, String key) throws Exception {
        var request = post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON).content(body);
        if (key != null) request.header("Idempotency-Key", key);
        return mockMvc.perform(request);
    }

    @Test
    void placeOrder_New_ShouldReturn201WithOrderNumber() throws Exception {
        when(orderService.placeOrder(eq(EMAIL), any(PlaceOrderRequest.class), eq(KEY)))
                .thenReturn(new OrderService.PlacedOrder(ORDER, "CM-ABCDEFGH", false));

        placeOrder(DELIVERY, KEY)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.orderId").value(ORDER.toString()))
                .andExpect(jsonPath("$.data.orderNumber").value("CM-ABCDEFGH"))
                .andExpect(jsonPath("$.data.duplicate").value(false));
    }

    @Test
    void placeOrder_RepeatedKey_ShouldReturn200WithTheOriginalOrder() throws Exception {
        when(orderService.placeOrder(eq(EMAIL), any(PlaceOrderRequest.class), eq(KEY)))
                .thenReturn(new OrderService.PlacedOrder(ORDER, "CM-ABCDEFGH", true));

        placeOrder(DELIVERY, KEY)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("This order was already placed."))
                .andExpect(jsonPath("$.data.orderId").value(ORDER.toString()))
                .andExpect(jsonPath("$.data.duplicate").value(true));
    }

    @Test
    void placeOrder_ConcurrentDuplicate_ShouldReturnTheOrderThatWon() throws Exception {
        when(orderService.placeOrder(eq(EMAIL), any(PlaceOrderRequest.class), eq(KEY)))
                .thenThrow(new DataIntegrityViolationException("uk_orders_buyer_idempotency_key"));
        when(orderService.findPlacedOrder(EMAIL, KEY))
                .thenReturn(Optional.of(new OrderService.PlacedOrder(ORDER, "CM-ABCDEFGH", true)));

        placeOrder(DELIVERY, KEY)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.duplicate").value(true));
    }

    @Test
    void placeOrder_WithoutKey_ShouldStillWork() throws Exception {
        when(orderService.placeOrder(eq(EMAIL), any(PlaceOrderRequest.class), isNull()))
                .thenReturn(new OrderService.PlacedOrder(ORDER, "CM-ABCDEFGH", false));

        placeOrder(DELIVERY, null).andExpect(status().isCreated());
    }

    @Test
    void placeOrder_InvalidKey_ShouldReturn400() throws Exception {
        placeOrder(DELIVERY, "short").andExpect(status().isBadRequest());
        placeOrder(DELIVERY, "has spaces in it!").andExpect(status().isBadRequest());

        verifyNoInteractions(orderService);
    }

    @Test
    void placeOrder_EmptyCart_ShouldReturn400WithCode() throws Exception {
        when(orderService.placeOrder(eq(EMAIL), any(PlaceOrderRequest.class), eq(KEY)))
                .thenThrow(new BadRequestException(OrderService.EMPTY_CART, "Your cart is empty."));

        placeOrder(DELIVERY, KEY)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("EMPTY_CART"))
                .andExpect(jsonPath("$.message").value("Your cart is empty."));
    }

    @Test
    void placeOrder_MissingFulfillmentType_ShouldReturn400() throws Exception {
        placeOrder("{}", KEY).andExpect(status().isBadRequest());

        verifyNoInteractions(orderService);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void placeOrder_AsAdmin_ShouldReturn403() throws Exception {
        placeOrder(DELIVERY, KEY).andExpect(status().isForbidden());

        verifyNoInteractions(orderService);
    }

    @Test
    void getOrder_ShouldReturnConfirmationDetails() throws Exception {
        when(orderService.getOrderConfirmation(ORDER, EMAIL)).thenReturn(OrderConfirmationResponse.builder()
                .id(ORDER).orderNumber("CM-ABCDEFGH").status(OrderStatus.PENDING).paymentStatus(PaymentStatus.UNPAID)
                .fulfillmentType(FulfillmentType.DELIVERY).deliveryAddress(new Address("12 Ring Rd", "Ho", null))
                .items(List.of(OrderItemDto.builder().name("Okro").unit("per kg").quantity(2)
                        .priceAtPurchaseCents(5000).lineTotalCents(10000).build()))
                .itemsSubtotalCents(10000).deliveryFeeCents(1000).finalTotalCents(11000)
                .createdAt(Instant.now()).build());

        mockMvc.perform(get("/api/v1/orders/" + ORDER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderNumber").value("CM-ABCDEFGH"))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.items[0].lineTotalCents").value(10000))
                .andExpect(jsonPath("$.data.deliveryAddress.town").value("Ho"))
                .andExpect(jsonPath("$.data.finalTotalCents").value(11000));
    }

    @Test
    void getOrder_NotTheBuyers_ShouldReturn404() throws Exception {
        when(orderService.getOrderConfirmation(ORDER, EMAIL)).thenThrow(new ResourceNotFoundException("Order not found"));

        mockMvc.perform(get("/api/v1/orders/" + ORDER)).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminNotifications_ShouldListAndMarkRead() throws Exception {
        UUID id = UUID.randomUUID();
        when(adminNotifier.recent()).thenReturn(new AdminNotificationsResponse(1, List.of(
                new NotificationResponse(id, NotificationType.NEW_ORDER, "New order CM-ABCDEFGH", ORDER, Instant.now(), false))));

        mockMvc.perform(get("/api/v1/admin/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(1))
                .andExpect(jsonPath("$.data.notifications[0].message").value("New order CM-ABCDEFGH"))
                .andExpect(jsonPath("$.data.notifications[0].read").value(false));
        mockMvc.perform(post("/api/v1/admin/notifications/" + id + "/read")).andExpect(status().isNoContent());
        mockMvc.perform(post("/api/v1/admin/notifications/read-all")).andExpect(status().isNoContent());

        verify(adminNotifier).markRead(id);
        verify(adminNotifier).markAllRead();
    }

    @Test
    void adminNotifications_AsBuyer_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/notifications")).andExpect(status().isForbidden());

        verifyNoInteractions(adminNotifier);
    }
}
