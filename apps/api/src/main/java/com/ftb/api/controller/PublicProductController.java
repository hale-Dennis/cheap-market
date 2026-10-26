package com.ftb.api.controller;

import java.util.Map;
import java.util.UUID;
import java.util.Optional;
import java.math.BigDecimal;
import java.time.Duration;

import com.ftb.api.util.ResponseHandler;
import lombok.RequiredArgsConstructor;
import com.ftb.api.service.ProductService;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.validation.ValidRegion;
import com.ftb.api.dto.request.CatalogQuery;
import com.ftb.api.exception.BadRequestException;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMin;
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
    /** The ?sort= options; each falls back to CATALOG_ORDER so pages stay stable. top_rated is ordered by the query. */
    static final Map<String, Sort> SORTS = Map.of(
            "newest", CATALOG_ORDER,
            "price_asc", Sort.by(Sort.Order.asc("price")).and(CATALOG_ORDER),
            "price_desc", Sort.by(Sort.Order.desc("price")).and(CATALOG_ORDER),
            "top_rated", Sort.unsorted());
    /** Catalog data changes rarely; let browsers and CDNs reuse it for 5 minutes. */
    static final CacheControl CATALOG_CACHE = CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic();

    private final ProductService productService;

    /**
     * Active listings from active farmers in a region, optionally narrowed and sorted.
     * @param region   A region code, e.g. GREATER_ACCRA.
     * @param q        Text to find in the produce or farmer name.
     * @param minPrice Lowest price in cedis, inclusive.
     * @param maxPrice Highest price in cedis, inclusive.
     * @param sort     newest (default), price_asc, price_desc or top_rated (farmer rating).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<ProductCardResponse>>> getPublicProducts(
            @RequestParam @NotBlank(message = "is required") @ValidRegion String region,
            @RequestParam Optional<UUID> categoryId,
            @RequestParam Optional<@Size(max = 100, message = "must be at most 100 characters") String> q,
            @RequestParam Optional<@DecimalMin(value = "0", message = "must be 0 or greater") BigDecimal> minPrice,
            @RequestParam Optional<@DecimalMin(value = "0", message = "must be 0 or greater") BigDecimal> maxPrice,
            @RequestParam(defaultValue = "newest")
            @Pattern(regexp = "newest|price_asc|price_desc|top_rated",
                    message = "must be one of newest, price_asc, price_desc, top_rated") String sort,
            @RequestParam(defaultValue = "0")
            @Min(value = 0, message = "must be 0 or greater") int page,
            @RequestParam(defaultValue = "" + DEFAULT_PAGE_SIZE)
            @Min(value = 1, message = "must be at least 1")
            @Max(value = MAX_PAGE_SIZE, message = "must be at most " + MAX_PAGE_SIZE) int size
    ) {
        if (minPrice.isPresent() && maxPrice.isPresent() && minPrice.get().compareTo(maxPrice.get()) > 0) {
            throw new BadRequestException("minPrice: must not be more than maxPrice");
        }
        PaginatedResponse<ProductCardResponse> products = productService.getPublicProducts(
                region, categoryId, new CatalogQuery(q, minPrice, maxPrice, sort.equals("top_rated")),
                PageRequest.of(page, size, SORTS.get(sort)));
        return ResponseEntity.ok()
                .cacheControl(CATALOG_CACHE)
                .body(ResponseHandler.successResponse("Products retrieved successfully.", HttpStatus.OK, products).getBody());
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getPublicProductById(@PathVariable UUID productId) {
        ProductDetailResponse product = productService.getPublicProductById(productId);
        return ResponseEntity.ok()
                .cacheControl(CATALOG_CACHE)
                .body(ResponseHandler.successResponse("Product details retrieved successfully.", HttpStatus.OK, product).getBody());
    }
}
