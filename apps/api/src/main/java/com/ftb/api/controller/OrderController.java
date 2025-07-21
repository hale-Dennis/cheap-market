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
        return ResponseHandler.successResponse("Order placed successfully.", HttpStatus.CREATED, new PlaceOrderResponseDto(newOrderId));
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