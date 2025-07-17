package com.ftb.api.controller;

import com.ftb.api.dto.request.UpdateCartRequest;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.dto.response.CartResponseDto;
import com.ftb.api.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cart")
@PreAuthorize("hasRole('BUYER')")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponseDto>> getCart(Authentication authentication) {
        CartResponseDto cart = cartService.getCartForBuyer(authentication.getName());
        ApiResponse<CartResponseDto> response = ApiResponse.<CartResponseDto>builder()
                .status(200)
                .message("Cart retrieved successfully.")
                .data(cart)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CartResponseDto>> addItemToCart(
            Authentication authentication,
            @Valid @RequestBody UpdateCartRequest request
    ) {
        CartResponseDto updatedCart = cartService.addItemToCart(authentication.getName(), request);
        ApiResponse<CartResponseDto> response = ApiResponse.<CartResponseDto>builder()
                .status(200)
                .message("Cart updated successfully.")
                .data(updatedCart)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponseDto>> removeItemFromCart(
            Authentication authentication,
            @PathVariable UUID productId
    ) {
        CartResponseDto updatedCart = cartService.removeItemFromCart(authentication.getName(), productId);
        ApiResponse<CartResponseDto> response = ApiResponse.<CartResponseDto>builder()
                .status(200)
                .message("Item removed from cart successfully.")
                .data(updatedCart)
                .build();
        return ResponseEntity.ok(response);
    }
}