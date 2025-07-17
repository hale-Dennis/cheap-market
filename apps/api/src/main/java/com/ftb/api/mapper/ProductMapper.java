package com.ftb.api.mapper;

import com.ftb.api.dto.request.CreateProductRequest;
import com.ftb.api.dto.response.ProductResponse;
import com.ftb.api.model.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    Product toProduct(CreateProductRequest request);

    @Mapping(source = "farmer.id", target = "farmerId")
    @Mapping(source = "category.id", target = "categoryId")
    ProductResponse toProductResponse(Product product);
}