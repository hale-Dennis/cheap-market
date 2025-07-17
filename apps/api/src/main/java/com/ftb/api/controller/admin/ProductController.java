package com.ftb.api.controller.admin;

import com.ftb.api.dto.request.CreateProductRequest;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.dto.response.ProductResponse;
import com.ftb.api.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/products")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody CreateProductRequest request) {
        ProductResponse newProduct = productService.createProduct(request);
        ApiResponse<ProductResponse> response = ApiResponse.<ProductResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("Product listing created successfully.")
                .data(newProduct)
                .build();
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}