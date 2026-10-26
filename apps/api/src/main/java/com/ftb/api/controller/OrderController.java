package com.ftb.api.controller;

import java.util.UUID;
import java.util.Optional;
import com.ftb.api.model.OrderStatusGroup;

import com.ftb.api.util.ResponseHandler;
import jakarta.validation.Valid;
import com.ftb.api.dto.response.*;
import lombok.RequiredArgsConstructor;
import com.ftb.api.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import com.ftb.api.dto.request.PlaceOrderRequest;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.constraints.Pattern;
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/api/v1/orders")
@PreAuthorize("hasRole('BUYER')")
@RequiredArgsConstructor
public class OrderController {

    static final int DEFAULT_PAGE_SIZE = 10;
    static final int MAX_PAGE_SIZE = 50;
    static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));

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

    /**
     * The buyer's orders, newest first, {@value #DEFAULT_PAGE_SIZE} per page by default.
     * @param status Only one order-history tab: active, completed or disputed.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<OrderSummaryResponseDto>>> listBuyerOrders(
            Authentication authentication,
            @RequestParam Optional<@Pattern(regexp = "active|completed|disputed",
                    message = "must be one of active, completed, disputed") String> status,
            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "must be 0 or greater") int page,
            @RequestParam(defaultValue = "" + DEFAULT_PAGE_SIZE)
            @Min(value = 1, message = "must be at least 1")
            @Max(value = MAX_PAGE_SIZE, message = "must be at most " + MAX_PAGE_SIZE) int size
    ) {
        PaginatedResponse<OrderSummaryResponseDto> orders = orderService.getOrdersForBuyer(
                authentication.getName(), status.map(OrderStatusGroup::fromParam), PageRequest.of(page, size, NEWEST_FIRST));
        return ResponseHandler.successResponse("Order history retrieved successfully.", HttpStatus.OK, orders);
    }

    /** How many of the buyer's orders are in each order-history tab. */
    @GetMapping("/status-counts")
    public ResponseEntity<ApiResponse<OrderStatusCountsResponse>> countBuyerOrders(Authentication authentication) {
        OrderStatusCountsResponse counts = orderService.countOrdersForBuyer(authentication.getName());
        return ResponseHandler.successResponse("Order counts retrieved successfully.", HttpStatus.OK, counts);
    }
}