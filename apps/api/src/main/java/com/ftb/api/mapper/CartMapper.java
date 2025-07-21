package com.ftb.api.mapper;

import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.ftb.api.model.Cart;
import com.ftb.api.model.CartItem;
import org.mapstruct.AfterMapping;
import org.mapstruct.MappingTarget;
import com.ftb.api.dto.response.CartItemDto;
import com.ftb.api.dto.response.CartResponseDto;


@Mapper(componentModel = "spring")
public interface CartMapper {

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "name")
    @Mapping(target = "primaryImageUrl", expression = "java(getPrimaryImageUrl(item.getProduct().getImageUrls()))")
    CartItemDto toCartItemDto(CartItem item);

    CartResponseDto toCartResponseDto(Cart cart);

    @AfterMapping
    default void calculateTotals(@MappingTarget CartResponseDto dto, Cart cart) {
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            dto.setTotalItems(0);
            dto.setSubtotalCents(0L);
            return;
        }
        dto.setTotalItems(cart.getItems().stream().mapToInt(CartItem::getQuantity).sum());
        dto.setSubtotalCents(cart.getItems().stream()
                .mapToLong(item -> (long) item.getQuantity() * item.getPriceCentsAtAdd())
                .sum());
    }

    default String getPrimaryImageUrl(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return null;
        }
        return imageUrls.getFirst();
    }
}