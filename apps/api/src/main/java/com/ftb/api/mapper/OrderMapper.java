package com.ftb.api.mapper;

import com.ftb.api.dto.response.AdminOrderSummaryDto;
import org.mapstruct.Mapper;
import com.ftb.api.dto.response.PickupLocationResponseDto;
import com.ftb.api.model.PickupLocation;
import org.mapstruct.Mapping;
import com.ftb.api.model.Order;
import com.ftb.api.model.OrderItem;
import com.ftb.api.dto.response.OrderItemDto;
import com.ftb.api.dto.response.OrderSummaryResponseDto;
import com.ftb.api.dto.response.OrderConfirmationResponse;
import org.mapstruct.Named;

import java.math.BigDecimal;


@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(source = "itemsSubtotal", target = "itemsSubtotalCents", qualifiedByName = "bigDecimalToCents")
    @Mapping(source = "deliveryFee", target = "deliveryFeeCents", qualifiedByName = "bigDecimalToCents")
    @Mapping(source = "finalTotal", target = "finalTotalCents", qualifiedByName = "bigDecimalToCents")
    OrderConfirmationResponse toOrderConfirmationResponse(Order order);

    default OrderItemDto toOrderItemDto(OrderItem orderItem) {
        long unitCents = bigDecimalToCents(orderItem.getPriceAtPurchase());
        return OrderItemDto.builder()
                .productId(orderItem.getProduct().getId())
                .name(orderItem.getProduct().getName())
                .unit(orderItem.getProduct().getUnit())
                .quantity(orderItem.getQuantity())
                .priceAtPurchaseCents(Math.toIntExact(unitCents))
                .lineTotalCents(unitCents * orderItem.getQuantity())
                .build();
    }

    PickupLocationResponseDto toPickupLocationResponseDto(PickupLocation location);

    @Mapping(source = "finalTotal", target = "finalTotalCents", qualifiedByName = "bigDecimalToCents")
    OrderSummaryResponseDto toOrderSummaryResponseDto(Order order);

    @Mapping(source = "buyer.fullName", target = "buyerName")
    @Mapping(source = "finalTotal", target = "finalTotalCents", qualifiedByName = "bigDecimalToCents")
    AdminOrderSummaryDto toAdminOrderSummaryDto(Order order);

    @Named("bigDecimalToCents")
    default long bigDecimalToCents(BigDecimal value) {
        if (value == null) {
            return 0L;
        }
        return value.movePointRight(2).longValue();
    }
}