package com.ftb.api.controller.admin;

import com.ftb.api.dto.request.PartialUpdateProductRequest;
import com.ftb.api.dto.request.UpdateProductRequest;
import com.ftb.api.dto.response.PaginatedResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.ftb.api.util.ResponseHandler;
import com.ftb.api.service.ProductService;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import com.ftb.api.dto.response.ProductResponse;
import com.ftb.api.dto.request.CreateProductRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.UUID;


@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody CreateProductRequest request) {
        ProductResponse newProduct = productService.createProduct(request);
        return ResponseHandler.successResponse("Product listing created successfully.", HttpStatus.CREATED, newProduct);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<ProductResponse>>> getAllAdminProducts(Pageable pageable) {
        PaginatedResponse<ProductResponse> products = productService.getAdminProducts(pageable);
        return ResponseHandler.successResponse("Admin products retrieved successfully.", HttpStatus.OK, products);
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> getAdminProductById(@PathVariable UUID productId) {
        ProductResponse product = productService.getAdminProductById(productId);
        return ResponseHandler.successResponse("Admin product details retrieved successfully.", HttpStatus.OK, product);
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        ProductResponse updatedProduct = productService.updateProduct(productId, request);
        return ResponseHandler.successResponse("Product updated successfully.", HttpStatus.OK, updatedProduct);
    }

    @PatchMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> partialUpdateProduct(
            @PathVariable UUID productId,
            @Valid @RequestBody PartialUpdateProductRequest request
    ) {
        ProductResponse updatedProduct = productService.partialUpdateProduct(productId, request);
        return ResponseHandler.successResponse("Product updated successfully.", HttpStatus.OK, updatedProduct);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID productId) {
        productService.deleteProduct(productId);
        return ResponseEntity.noContent().build();
    }

}