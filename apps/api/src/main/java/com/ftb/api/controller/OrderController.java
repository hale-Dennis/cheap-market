package com.ftb.api.controller;

import java.util.UUID;
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
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/api/v1/orders")
@PreAuthorize("hasRole('BUYER')")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<PlaceOrderResponseDto>> placeOrder(
            Authentication authentication,
            @Valid @RequestBody PlaceOrderRequest request
    ) {
        UUID newOrderId = orderService.placeOrder(authentication.getName(), request);
        ApiResponse<PlaceOrderResponseDto> response = ApiResponse.<PlaceOrderResponseDto>builder()
                .status(HttpStatus.CREATED.value())
                .message("Order placed successfully.")
                .data(new PlaceOrderResponseDto(newOrderId))
                .build();
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderConfirmationResponse>> getOrderConfirmation(
            Authentication authentication,
            @PathVariable UUID orderId
    ) {
        OrderConfirmationResponse orderDetails = orderService.getOrderConfirmation(orderId, authentication.getName());
        ApiResponse<OrderConfirmationResponse> response = ApiResponse.<OrderConfirmationResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Order details retrieved successfully.")
                .data(orderDetails)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<OrderSummaryResponseDto>>> listBuyerOrders(
            Authentication authentication,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PaginatedResponse<OrderSummaryResponseDto> orders = orderService.getOrdersForBuyer(authentication.getName(), pageable);
        ApiResponse<PaginatedResponse<OrderSummaryResponseDto>> response = ApiResponse.<PaginatedResponse<OrderSummaryResponseDto>>builder()
                .status(200)
                .message("Order history retrieved successfully.")
                .data(orders)
                .build();
        return ResponseEntity.ok(response);
    }
}