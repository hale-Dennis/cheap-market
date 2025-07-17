package com.ftb.api.controller;

import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.dto.response.ProductCardResponse;
import com.ftb.api.dto.response.ProductDetailResponse;
import com.ftb.api.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

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