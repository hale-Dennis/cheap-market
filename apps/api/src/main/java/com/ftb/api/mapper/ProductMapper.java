package com.ftb.api.mapper;

import com.ftb.api.dto.request.CreateProductRequest;
import com.ftb.api.dto.response.FarmerInfo;
import com.ftb.api.dto.response.ProductCardResponse;
import com.ftb.api.dto.response.ProductDetailResponse;
import com.ftb.api.dto.response.ProductResponse;
import com.ftb.api.model.Product;
import com.ftb.api.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    Product toProduct(CreateProductRequest request);

    @Mapping(source = "farmer.id", target = "farmerId")
    @Mapping(source = "category.id", target = "categoryId")
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
}