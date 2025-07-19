package com.ftb.api.controller;

import java.util.UUID;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import com.ftb.api.service.ProductService;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import com.ftb.api.dto.response.PaginatedResponse;
import org.springframework.data.web.PageableDefault;
import com.ftb.api.dto.response.ProductCardResponse;
import com.ftb.api.dto.response.ProductDetailResponse;


@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class PublicProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<ProductCardResponse>>> getPublicProducts(
            @RequestParam String region,
            @RequestParam Optional<UUID> categoryId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PaginatedResponse<ProductCardResponse> products = productService.getPublicProducts(region, categoryId, pageable);
        ApiResponse<PaginatedResponse<ProductCardResponse>> response = ApiResponse.<PaginatedResponse<ProductCardResponse>>builder()
                .status(200)
                .message("Products retrieved successfully.")
                .data(products)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getPublicProductById(@PathVariable UUID productId) {
        ProductDetailResponse product = productService.getPublicProductById(productId);
        ApiResponse<ProductDetailResponse> response = ApiResponse.<ProductDetailResponse>builder()
                .status(200)
                .message("Product details retrieved successfully.")
                .data(product)
                .build();
        return ResponseEntity.ok(response);
    }
}