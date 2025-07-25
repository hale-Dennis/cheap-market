package com.ftb.api.mapper;

import java.math.BigDecimal;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.ftb.api.model.User;
import com.ftb.api.model.Product;
import com.ftb.api.dto.response.FarmerInfo;
import com.ftb.api.dto.response.ProductResponse;
import com.ftb.api.dto.response.ProductCardResponse;
import com.ftb.api.dto.request.CreateProductRequest;
import com.ftb.api.dto.response.ProductDetailResponse;
import org.mapstruct.Named;


@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(source = "priceCents", target = "price", qualifiedByName = "centsToBigDecimal")
    Product toProduct(CreateProductRequest request);

    @Mapping(source = "farmer.id", target = "farmerId")
    @Mapping(source = "category.id", target = "categoryId")
    @Mapping(source = "price", target = "priceCents", qualifiedByName = "bigDecimalToCentsInt")
    ProductResponse toProductResponse(Product product);

    @Mapping(target = "primaryImageUrl", expression = "java(getPrimaryImageUrl(product.getImageUrls()))")
    ProductCardResponse toProductCardResponse(Product product);

    default String getPrimaryImageUrl(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return null;
        }
        return imageUrls.getFirst();
    }

    @Mapping(source = "farmer", target = "farmer")
    ProductDetailResponse toProductDetailResponse(Product product);

    FarmerInfo toFarmerInfo(User farmer);

    @Named("centsToBigDecimal")
    default BigDecimal centsToBigDecimal(Integer cents) {
        if (cents == null) {
            return null;
        }
        return BigDecimal.valueOf(cents).movePointLeft(2);
    }

    @Named("bigDecimalToCentsInt")
    default Integer bigDecimalToCentsInt(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.movePointRight(2).intValue();
    }
}