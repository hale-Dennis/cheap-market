package com.ftb.api.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.ftb.api.model.Order;
import com.ftb.api.model.OrderItem;
import com.ftb.api.dto.response.OrderItemDto;
import com.ftb.api.dto.response.OrderSummaryResponseDto;
import com.ftb.api.dto.response.OrderConfirmationResponse;


@Mapper(componentModel = "spring")
public interface OrderMapper {

    OrderConfirmationResponse toOrderConfirmationResponse(Order order);

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "name")
    OrderItemDto toOrderItemDto(OrderItem orderItem);

    OrderSummaryResponseDto toOrderSummaryResponseDto(Order order);
}