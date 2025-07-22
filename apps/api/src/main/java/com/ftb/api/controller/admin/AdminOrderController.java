package com.ftb.api.controller.admin;

import com.ftb.api.dto.request.UpdateOrderStatusRequest;
import com.ftb.api.dto.response.AdminOrderSummaryDto;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.dto.response.OrderConfirmationResponse;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.service.OrderService;
import com.ftb.api.util.ResponseHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderConfirmationResponse>> updateOrderStatus(
            @PathVariable UUID orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        OrderConfirmationResponse updatedOrder = orderService.updateOrderStatus(orderId, request);
        return ResponseHandler.successResponse("Order status updated successfully.", HttpStatus.OK, updatedOrder);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<AdminOrderSummaryDto>>> getAllOrders(Pageable pageable) {
        PaginatedResponse<AdminOrderSummaryDto> orders = orderService.getAllOrders(pageable);
        return ResponseHandler.successResponse("All orders retrieved successfully.", HttpStatus.OK, orders);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderConfirmationResponse>> getAdminOrderById(@PathVariable UUID orderId) {
        OrderConfirmationResponse orderDetails = orderService.getAdminOrderById(orderId);
        return ResponseHandler.successResponse("Order details retrieved successfully.", HttpStatus.OK, orderDetails);
    }
}