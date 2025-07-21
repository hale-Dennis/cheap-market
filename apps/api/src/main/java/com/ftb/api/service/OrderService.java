package com.ftb.api.service;

import com.ftb.api.dto.request.PlaceOrderRequest;
import com.ftb.api.dto.response.OrderConfirmationResponse;
import com.ftb.api.exception.InvalidRequestException;
import com.ftb.api.exception.ResourceNotFoundException;
import com.ftb.api.mapper.OrderMapper;
import com.ftb.api.model.*;
import com.ftb.api.model.FulfillmentType;
import com.ftb.api.model.OrderStatus;
import com.ftb.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.ftb.api.dto.response.OrderSummaryResponseDto;
import com.ftb.api.dto.response.PaginatedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final PickupLocationRepository pickupLocationRepository;
    private final OrderMapper orderMapper;

    @Transactional
    public UUID placeOrder(String buyerEmail, PlaceOrderRequest request) {

        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + buyerEmail));
        Cart cart = cartRepository.findByBuyerId(buyer.getId())
                .orElseThrow(() -> new InvalidRequestException("Cart not found for user."));

        if (cart.getItems().isEmpty()) {
            throw new InvalidRequestException("Cannot place an order with an empty cart.");
        }

        Order order = new Order();
        order.setBuyer(buyer);
        order.setStatus(OrderStatus.PENDING);

        order.setItems(cart.getItems().stream().map(cartItem -> {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPriceAtPurchase(BigDecimal.valueOf(cartItem.getPriceCentsAtAdd()).movePointLeft(2));
            return orderItem;
        }).collect(Collectors.toList()));

        BigDecimal subtotal = order.getItems().stream()
                .map(item -> item.getPriceAtPurchase().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setItemsSubtotal(subtotal);

        BigDecimal deliveryFee = request.getFulfillmentType() == FulfillmentType.DELIVERY ? new BigDecimal("10.00") : BigDecimal.ZERO;
        order.setDeliveryFee(deliveryFee);
        order.setFinalTotal(subtotal.add(deliveryFee));
        order.setFulfillmentType(request.getFulfillmentType());

        if (request.getFulfillmentType() == FulfillmentType.PICKUP) {
            PickupLocation location = pickupLocationRepository.findById(request.getPickupLocationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Selected pickup location not found."));
            order.setPickupLocation(location);
        } else {
            order.setDeliveryAddress(buyer.getDeliveryAddress());
        }

        Order savedOrder = orderRepository.save(order);

        cart.getItems().clear();
        cartRepository.save(cart);

        log.info("New order placed: {}. Admin notification required.", savedOrder.getId());

        return savedOrder.getId();
    }

    @Transactional(readOnly = true)
    public OrderConfirmationResponse getOrderConfirmation(UUID orderId, String buyerEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!order.getBuyer().getEmail().equals(buyerEmail)) {
            throw new AccessDeniedException("You do not have permission to view this order.");
        }

        return orderMapper.toOrderConfirmationResponse(order);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<OrderSummaryResponseDto> getOrdersForBuyer(String buyerEmail, Pageable pageable) {

        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + buyerEmail));


        Page<Order> orderPage = orderRepository.findByBuyerId(buyer.getId(), pageable);


        List<OrderSummaryResponseDto> orderSummaries = orderPage.getContent().stream()
                .map(orderMapper::toOrderSummaryResponseDto)
                .collect(Collectors.toList());

        return PaginatedResponse.<OrderSummaryResponseDto>builder()
                .content(orderSummaries)
                .currentPage(orderPage.getNumber())
                .totalPages(orderPage.getTotalPages())
                .totalElements(orderPage.getTotalElements())
                .size(orderPage.getSize())
                .build();
    }
}