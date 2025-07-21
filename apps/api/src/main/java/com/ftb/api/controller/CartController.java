package com.ftb.api.controller;

import java.util.UUID;

import com.ftb.api.util.ResponseHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.ftb.api.service.CartService;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.ftb.api.dto.response.CartResponseDto;
import org.springframework.web.bind.annotation.*;
import com.ftb.api.dto.request.UpdateCartRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/api/v1/cart")
@PreAuthorize("hasRole('BUYER')")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponseDto>> getCart(Authentication authentication) {
        CartResponseDto cart = cartService.getCartForBuyer(authentication.getName());
        return ResponseHandler.successResponse("Cart retrieved successfully.", HttpStatus.OK, cart);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CartResponseDto>> addItemToCart(
            Authentication authentication,
            @Valid @RequestBody UpdateCartRequest request
    ) {
        CartResponseDto updatedCart = cartService.addItemToCart(authentication.getName(), request);
        return ResponseHandler.successResponse("Cart updated successfully.", HttpStatus.OK, updatedCart);
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponseDto>> removeItemFromCart(
            Authentication authentication,
            @PathVariable UUID productId
    ) {
        CartResponseDto updatedCart = cartService.removeItemFromCart(authentication.getName(), productId);
        return ResponseHandler.successResponse("Item removed from cart successfully.", HttpStatus.OK, updatedCart);
    }
}