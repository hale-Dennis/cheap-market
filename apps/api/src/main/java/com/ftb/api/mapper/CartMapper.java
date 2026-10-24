package com.ftb.api.mapper;

import java.util.List;
import org.mapstruct.Mapper;
import com.ftb.api.model.Cart;
import com.ftb.api.model.CartItem;
import com.ftb.api.model.Product;
import com.ftb.api.model.ProductStatus;
import com.ftb.api.model.AccountStatus;
import com.ftb.api.dto.response.CartItemDto;
import com.ftb.api.dto.response.CartResponseDto;


@Mapper(componentModel = "spring")
public interface CartMapper {

    /** Whether a product can be bought: an active listing from a farmer who isn't suspended. */
    static boolean isAvailable(Product product) {
        return product.getListingStatus() == ProductStatus.ACTIVE
                && product.getFarmer().getAccountStatus() == AccountStatus.ACTIVE;
    }

    default CartItemDto toCartItemDto(CartItem item) {
        Product product = item.getProduct();
        int priceCents = product.getPrice().movePointRight(2).intValueExact();
        return CartItemDto.builder()
                .productId(product.getId())
                .name(product.getName())
                .unit(product.getUnit())
                .farmerName(product.getFarmer().getFullName())
                .priceCents(priceCents)
                .quantity(item.getQuantity())
                .lineTotalCents((long) priceCents * item.getQuantity())
                .primaryImageUrl(getPrimaryImageUrl(product.getImageUrls()))
                .available(isAvailable(product))
                .build();
    }

    default CartResponseDto toCartResponseDto(Cart cart) {
        List<CartItemDto> items = cart.getItems().stream().map(this::toCartItemDto).toList();
        return CartResponseDto.builder()
                .items(items)
                .totalItems(items.stream().mapToInt(CartItemDto::getQuantity).sum())
                .subtotalCents(items.stream().filter(CartItemDto::isAvailable).mapToLong(CartItemDto::getLineTotalCents).sum())
                .build();
    }

    default String getPrimaryImageUrl(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return null;
        }
        return imageUrls.getFirst();
    }
}
