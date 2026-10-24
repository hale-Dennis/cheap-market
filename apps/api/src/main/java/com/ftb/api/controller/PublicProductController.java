package com.ftb.api.controller;

import java.util.UUID;
import java.util.Optional;
import java.time.Duration;

import com.ftb.api.util.ResponseHandler;
import lombok.RequiredArgsConstructor;
import com.ftb.api.service.ProductService;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.validation.ValidRegion;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.dto.response.ProductCardResponse;
import com.ftb.api.dto.response.ProductDetailResponse;


@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class PublicProductController {

    static final int DEFAULT_PAGE_SIZE = 20;
    static final int MAX_PAGE_SIZE = 100;
    // Newest listings first, with a total order so pages never overlap or skip listings.
    static final Sort CATALOG_ORDER = Sort.by(
            Sort.Order.desc("createdAt"), Sort.Order.asc("name"), Sort.Order.asc("id"));
    /** Catalog data changes rarely; let browsers and CDNs reuse it for 5 minutes. */
    static final CacheControl CATALOG_CACHE = CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic();

    private final ProductService productService;

    /**
     * Active listings from active farmers in a region, optionally in one category.
     * @param region A region code, e.g. GREATER_ACCRA.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<ProductCardResponse>>> getPublicProducts(
            @RequestParam @NotBlank(message = "is required") @ValidRegion String region,
            @RequestParam Optional<UUID> categoryId,
            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "must be 0 or greater") int page,
            @RequestParam(defaultValue = "" + DEFAULT_PAGE_SIZE)
            @Min(value = 1, message = "must be at least 1")
            @Max(value = MAX_PAGE_SIZE, message = "must be at most " + MAX_PAGE_SIZE) int size
    ) {
        PaginatedResponse<ProductCardResponse> products =
                productService.getPublicProducts(region, categoryId, PageRequest.of(page, size, CATALOG_ORDER));
        return ResponseEntity.ok()
                .cacheControl(CATALOG_CACHE)
                .body(ResponseHandler.successResponse("Products retrieved successfully.", HttpStatus.OK, products).getBody());
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getPublicProductById(@PathVariable UUID productId) {
        ProductDetailResponse product = productService.getPublicProductById(productId);
        return ResponseHandler.successResponse("Product details retrieved successfully.", HttpStatus.OK, product);
    }
}
