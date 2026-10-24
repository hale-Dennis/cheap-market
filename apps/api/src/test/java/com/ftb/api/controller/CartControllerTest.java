package com.ftb.api.controller;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import com.ftb.api.service.JwtService;
import com.ftb.api.service.CartService;
import com.ftb.api.config.SecurityConfig;
import org.springframework.http.MediaType;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.config.JwtAuthenticationFilter;
import com.ftb.api.config.CustomAccessDeniedHandler;
import com.ftb.api.config.CustomAuthenticationEntryPoint;
import com.ftb.api.dto.response.CartItemDto;
import com.ftb.api.dto.request.UpdateCartRequest;
import com.ftb.api.dto.response.CartResponseDto;
import com.ftb.api.exception.InvalidRequestException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


@WebMvcTest(CartController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "application.security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw",
        "application.security.jwt.expiration=3600000"
})
@WithMockUser(username = "jane@example.com", roles = "BUYER")
class CartControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CartService cartService;

    @MockitoBean
    private UserRepository userRepository;

    private static final UUID PRODUCT = UUID.randomUUID();

    private static CartResponseDto cartWithOneItem() {
        CartItemDto item = CartItemDto.builder()
                .productId(PRODUCT).name("Okro").unit("per basket").priceCents(5000)
                .quantity(2).lineTotalCents(10000).available(true).build();
        return CartResponseDto.builder().items(List.of(item)).totalItems(2).subtotalCents(10000).build();
    }

    private String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    @Test
    void getCart_ShouldReturnItemsAndTotals() throws Exception {
        when(cartService.getCartForBuyer("jane@example.com")).thenReturn(cartWithOneItem());

        mockMvc.perform(get("/api/v1/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].name").value("Okro"))
                .andExpect(jsonPath("$.data.items[0].lineTotalCents").value(10000))
                .andExpect(jsonPath("$.data.items[0].available").value(true))
                .andExpect(jsonPath("$.data.subtotalCents").value(10000));
    }

    @Test
    void setItem_ShouldReturnUpdatedCart() throws Exception {
        when(cartService.addItemToCart(eq("jane@example.com"), any(UpdateCartRequest.class))).thenReturn(cartWithOneItem());

        mockMvc.perform(post("/api/v1/cart").contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateCartRequest(PRODUCT, 2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(2));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 100})
    void setItem_QuantityOutOfRange_ShouldReturn400(int quantity) throws Exception {
        mockMvc.perform(post("/api/v1/cart").contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateCartRequest(PRODUCT, quantity))))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(cartService);
    }

    @Test
    void setItem_InactiveProduct_ShouldReturn422WithCode() throws Exception {
        when(cartService.addItemToCart(eq("jane@example.com"), any(UpdateCartRequest.class)))
                .thenThrow(new InvalidRequestException(CartService.INACTIVE_PRODUCT,
                        "This product is no longer available and cannot be added to the cart."));

        mockMvc.perform(post("/api/v1/cart").contentType(MediaType.APPLICATION_JSON)
                        .content(json(new UpdateCartRequest(PRODUCT, 1))))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("INACTIVE_PRODUCT"))
                .andExpect(jsonPath("$.message").value("This product is no longer available and cannot be added to the cart."));
    }

    @Test
    void removeItem_ShouldReturnUpdatedCart() throws Exception {
        when(cartService.removeItemFromCart("jane@example.com", PRODUCT))
                .thenReturn(CartResponseDto.builder().items(List.of()).build());

        mockMvc.perform(delete("/api/v1/cart/items/" + PRODUCT))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isEmpty());
    }

    @Test
    void clearCart_ShouldReturnEmptyCart() throws Exception {
        when(cartService.clearCart("jane@example.com")).thenReturn(CartResponseDto.builder().items(List.of()).build());

        mockMvc.perform(delete("/api/v1/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cart cleared successfully."));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void anyEndpoint_AsAdmin_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/cart")).andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/v1/cart")).andExpect(status().isForbidden());

        verifyNoInteractions(cartService);
    }
}
