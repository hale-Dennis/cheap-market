package com.ftb.api.mapper;

import java.util.List;
import java.time.LocalDate;
import java.math.BigDecimal;
import com.ftb.api.model.User;
import com.ftb.api.model.Product;
import com.ftb.api.model.Category;
import org.junit.jupiter.api.Test;
import com.ftb.api.dto.response.ProductCardResponse;
import com.ftb.api.dto.response.ProductDetailResponse;
import static org.junit.jupiter.api.Assertions.*;


class ProductMapperTest {

    private final ProductMapper mapper = new ProductMapperImpl();

    private static Product product(List<String> images) {
        return Product.builder()
                .name("Tomatoes")
                .price(new BigDecimal("18.50"))
                .unit("per kg")
                .harvestDate(LocalDate.of(2026, 10, 24))
                .imageUrls(images)
                .farmer(User.builder().fullName("Ama Mensah").averageRating(4.5).build())
                .category(Category.builder().name("Vegetables").build())
                .build();
    }

    @Test
    void toProductCardResponse_ShouldConvertPriceAndPickFirstImage() {
        ProductCardResponse card = mapper.toProductCardResponse(product(List.of("/first.jpg", "/second.jpg")));

        assertEquals(1850, card.getPriceCents());
        assertEquals("/first.jpg", card.getPrimaryImageUrl());
        assertEquals("Ama Mensah", card.getFarmerName());
        assertEquals("Vegetables", card.getCategoryName());
        assertEquals(LocalDate.of(2026, 10, 24), card.getHarvestDate());
    }

    @Test
    void toProductCardResponse_WithoutImages_ShouldHaveNoPrimaryImage() {
        assertNull(mapper.toProductCardResponse(product(List.of())).getPrimaryImageUrl());
        assertNull(mapper.toProductCardResponse(product(null)).getPrimaryImageUrl());
    }

    @Test
    void toProductDetailResponse_ShouldConvertPrice() {
        ProductDetailResponse detail = mapper.toProductDetailResponse(product(List.of("/a.jpg")));

        assertEquals(1850, detail.getPriceCents());
        assertEquals("Ama Mensah", detail.getFarmer().getFullName());
    }
}
