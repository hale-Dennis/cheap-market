package com.ftb.api.controller.admin;

import com.ftb.api.dto.request.CategoryRequest;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.dto.response.CategoryResponse;
import com.ftb.api.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("/api/v1/admin/categories")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse newCategory = categoryService.createCategory(request);
        ApiResponse<CategoryResponse> response = ApiResponse.<CategoryResponse>builder()
                .status(HttpStatus.CREATED.value())
                .message("Category created successfully.")
                .data(newCategory)
                .build();
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = categoryService.getAllCategories();
        ApiResponse<List<CategoryResponse>> response = ApiResponse.<List<CategoryResponse>>builder()
                .status(HttpStatus.OK.value())
                .message("Categories retrieved successfully.")
                .data(categories)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequest request
    ) {
        CategoryResponse updatedCategory = categoryService.updateCategory(id, request);
        ApiResponse<CategoryResponse> response = ApiResponse.<CategoryResponse>builder()
                .status(HttpStatus.OK.value())
                .message("Category updated successfully.")
                .data(updatedCategory)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}