package com.ftb.api.service;

import com.ftb.api.dto.request.PlaceOrderRequest;
import com.ftb.api.dto.request.UpdateOrderStatusRequest;
import com.ftb.api.dto.response.AdminOrderSummaryDto;
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
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import com.ftb.api.mapper.CartMapper;
import com.ftb.api.util.OrderNumbers;
import com.ftb.api.exception.BadRequestException;
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
    private final DeliveryFeeService deliveryFeeService;
    private final AdminNotifier adminNotifier;

    /** Error codes returned when an order can't be placed. */
    public static final String EMPTY_CART = "EMPTY_CART";
    public static final String UNAVAILABLE_ITEMS = "UNAVAILABLE_ITEMS";
    public static final String PICKUP_LOCATION_REQUIRED = "PICKUP_LOCATION_REQUIRED";
    public static final String PICKUP_LOCATION_OUT_OF_REGION = "PICKUP_LOCATION_OUT_OF_REGION";
    public static final String DELIVERY_ADDRESS_REQUIRED = "DELIVERY_ADDRESS_REQUIRED";

    private static final int ORDER_NUMBER_ATTEMPTS = 5;

    /** The result of placing an order: the order, and whether it already existed (a repeated request). */
    public record PlacedOrder(UUID orderId, String orderNumber, boolean duplicate) {
    }

    /**
     * Turns the buyer's cart into a PENDING order at current prices, empties the cart and notifies the admins.
     * @param idempotencyKey Identifies one checkout attempt; a repeat with the same key returns the original order.
     */
    @Transactional
    public PlacedOrder placeOrder(String buyerEmail, PlaceOrderRequest request, String idempotencyKey) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + buyerEmail));

        // Checked first: the original request already emptied the cart.
        if (idempotencyKey != null) {
            Optional<Order> existing = orderRepository.findByBuyerIdAndIdempotencyKey(buyer.getId(), idempotencyKey);
            if (existing.isPresent()) {
                return new PlacedOrder(existing.get().getId(), existing.get().getOrderNumber(), true);
            }
        }

        Cart cart = cartRepository.findByBuyerIdWithItems(buyer.getId())
                .filter(c -> !c.getItems().isEmpty())
                .orElseThrow(() -> new BadRequestException(EMPTY_CART, "Your cart is empty."));

        List<String> unavailable = cart.getItems().stream()
                .map(CartItem::getProduct)
                .filter(product -> !CartMapper.isAvailable(product))
                .map(Product::getName)
                .toList();
        if (!unavailable.isEmpty()) {
            throw new InvalidRequestException(UNAVAILABLE_ITEMS,
                    "Some items are no longer available: " + String.join(", ", unavailable) + ". Remove them from your cart.");
        }

        Order order = new Order();
        order.setBuyer(buyer);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        order.setIdempotencyKey(idempotencyKey);
        order.setOrderNumber(newOrderNumber());
        order.setFulfillmentType(request.getFulfillmentType());

        if (request.getFulfillmentType() == FulfillmentType.PICKUP) {
            if (request.getPickupLocationId() == null) {
                throw new BadRequestException(PICKUP_LOCATION_REQUIRED, "Choose a pickup point.");
            }
            PickupLocation location = pickupLocationRepository.findById(request.getPickupLocationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Selected pickup location not found."));
            if (!location.getRegion().equals(buyer.getRegion())) {
                throw new InvalidRequestException(PICKUP_LOCATION_OUT_OF_REGION, "Choose a pickup point in your region.");
            }
            order.setPickupLocation(location);
        } else {
            Address address = buyer.getDeliveryAddress();
            if (address == null || address.getStreet() == null) {
                throw new InvalidRequestException(DELIVERY_ADDRESS_REQUIRED, "Add a delivery address to your profile first.");
            }
            // A copy: later profile changes must not alter where this order goes.
            order.setDeliveryAddress(new Address(address.getStreet(), address.getTown(), address.getGpsAddress()));
        }

        // Current prices, as shown in the cart and at checkout.
        order.setItems(cart.getItems().stream().map(cartItem -> {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPriceAtPurchase(cartItem.getProduct().getPrice());
            return orderItem;
        }).collect(Collectors.toList()));

        BigDecimal subtotal = order.getItems().stream()
                .map(item -> item.getPriceAtPurchase().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setItemsSubtotal(subtotal);

        // Same fee the checkout page quoted (DeliveryFeeService), based on the buyer's region.
        BigDecimal deliveryFee = request.getFulfillmentType() == FulfillmentType.DELIVERY
                ? deliveryFeeService.feeFor(buyer.getRegion())
                : BigDecimal.ZERO;
        order.setDeliveryFee(deliveryFee);
        order.setFinalTotal(subtotal.add(deliveryFee));

        Order savedOrder = orderRepository.saveAndFlush(order);

        List.copyOf(cart.getItems()).forEach(cart::removeItem);
        cartRepository.save(cart);

        adminNotifier.notifyNewOrder(savedOrder.getId(), newOrderMessage(savedOrder, buyer));
        return new PlacedOrder(savedOrder.getId(), savedOrder.getOrderNumber(), false);
    }

    /** The order a buyer already placed for this checkout attempt (used after a concurrent duplicate). */
    @Transactional(readOnly = true)
    public Optional<PlacedOrder> findPlacedOrder(String buyerEmail, String idempotencyKey) {
        return userRepository.findByEmail(buyerEmail)
                .flatMap(buyer -> orderRepository.findByBuyerIdAndIdempotencyKey(buyer.getId(), idempotencyKey))
                .map(order -> new PlacedOrder(order.getId(), order.getOrderNumber(), true));
    }

    private String newOrderNumber() {
        for (int attempt = 0; attempt < ORDER_NUMBER_ATTEMPTS; attempt++) {
            String candidate = OrderNumbers.next();
            if (!orderRepository.existsByOrderNumber(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not generate a unique order number");
    }

    private static String newOrderMessage(Order order, User buyer) {
        int items = order.getItems().stream().mapToInt(OrderItem::getQuantity).sum();
        String fulfillment = order.getFulfillmentType() == FulfillmentType.PICKUP
                ? "pickup at " + order.getPickupLocation().getName()
                : "home delivery to " + order.getDeliveryAddress().getTown();
        return String.format("New order %s from %s: %d item%s, GH₵ %s, %s.",
                order.getOrderNumber(), buyer.getFullName(), items, items == 1 ? "" : "s",
                order.getFinalTotal().setScale(2), fulfillment);
    }

    /** A buyer's own order; other buyers' orders are reported as not found rather than forbidden. */
    @Transactional(readOnly = true)
    public OrderConfirmationResponse getOrderConfirmation(UUID orderId, String buyerEmail) {
        Order order = orderRepository.findWithDetailsById(orderId)
                .filter(o -> o.getBuyer().getEmail().equals(buyerEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

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

    @Transactional
    public OrderConfirmationResponse updateOrderStatus(UUID orderId, UpdateOrderStatusRequest request) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        order.setStatus(request.getStatus());

        Order updatedOrder = orderRepository.save(order);

        return orderMapper.toOrderConfirmationResponse(updatedOrder);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<AdminOrderSummaryDto> getAllOrders(Pageable pageable) {
        Page<Order> orderPage = orderRepository.findAll(pageable);

        List<AdminOrderSummaryDto> orderSummaries = orderPage.getContent().stream()
                .map(orderMapper::toAdminOrderSummaryDto)
                .collect(Collectors.toList());

        return PaginatedResponse.<AdminOrderSummaryDto>builder()
                .content(orderSummaries)
                .currentPage(orderPage.getNumber())
                .totalPages(orderPage.getTotalPages())
                .totalElements(orderPage.getTotalElements())
                .size(orderPage.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public OrderConfirmationResponse getAdminOrderById(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        return orderMapper.toOrderConfirmationResponse(order);
    }
}