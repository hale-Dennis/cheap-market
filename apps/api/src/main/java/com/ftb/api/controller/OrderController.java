package com.ftb.api.controller;

import java.util.UUID;

import com.ftb.api.util.ResponseHandler;
import jakarta.validation.Valid;
import com.ftb.api.dto.response.*;
import lombok.RequiredArgsConstructor;
import com.ftb.api.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Pageable;
import com.ftb.api.dto.request.PlaceOrderRequest;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.constraints.Pattern;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/api/v1/orders")
@PreAuthorize("hasRole('BUYER')")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * Places an order from the buyer's cart. Send the same {@code Idempotency-Key} when retrying a checkout:
     * a repeat returns the original order (200, {@code duplicate: true}) instead of creating another.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PlaceOrderResponseDto>> placeOrder(
            Authentication authentication,
            @RequestHeader(name = "Idempotency-Key", required = false)
            @Pattern(regexp = "^[A-Za-z0-9-]{8,64}$", message = "must be 8–64 letters, digits or dashes") String idempotencyKey,
            @Valid @RequestBody PlaceOrderRequest request
    ) {
        OrderService.PlacedOrder placed;
        try {
            placed = orderService.placeOrder(authentication.getName(), request, idempotencyKey);
        } catch (DataIntegrityViolationException ex) {
            // A simultaneous request with the same key won the race; return the order it created.
            if (idempotencyKey == null) throw ex;
            placed = orderService.findPlacedOrder(authentication.getName(), idempotencyKey).orElseThrow(() -> ex);
        }
        PlaceOrderResponseDto body = new PlaceOrderResponseDto(placed.orderId(), placed.orderNumber(), placed.duplicate());
        return placed.duplicate()
                ? ResponseHandler.successResponse("This order was already placed.", HttpStatus.OK, body)
                : ResponseHandler.successResponse("Order placed successfully.", HttpStatus.CREATED, body);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderConfirmationResponse>> getOrderConfirmation(
            Authentication authentication,
            @PathVariable UUID orderId
    ) {
        OrderConfirmationResponse orderDetails = orderService.getOrderConfirmation(orderId, authentication.getName());
        return ResponseHandler.successResponse("Order details retrieved successfully.", HttpStatus.OK, orderDetails);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<OrderSummaryResponseDto>>> listBuyerOrders(
            Authentication authentication,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PaginatedResponse<OrderSummaryResponseDto> orders = orderService.getOrdersForBuyer(authentication.getName(), pageable);
        return ResponseHandler.successResponse("Order history retrieved successfully.", HttpStatus.OK, orders);
    }
}