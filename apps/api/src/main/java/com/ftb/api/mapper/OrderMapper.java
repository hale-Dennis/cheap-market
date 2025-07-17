package com.ftb.api.mapper;

import com.ftb.api.dto.response.OrderConfirmationResponse;
import com.ftb.api.dto.response.OrderItemDto;
import com.ftb.api.dto.response.OrderSummaryResponseDto;
import com.ftb.api.model.Order;
import com.ftb.api.model.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    OrderConfirmationResponse toOrderConfirmationResponse(Order order);

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "name")
    OrderItemDto toOrderItemDto(OrderItem orderItem);

    OrderSummaryResponseDto toOrderSummaryResponseDto(Order order);
}