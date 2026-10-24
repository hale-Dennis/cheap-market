package com.ftb.api.controller;

import java.util.List;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import com.ftb.api.util.ResponseHandler;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import com.ftb.api.service.CategoryService;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import com.ftb.api.dto.response.CategoryResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


/** Read-only category list for the public catalog's filter. */
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class PublicCategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories() {
        List<CategoryResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
                .body(ResponseHandler.successResponse("Categories retrieved successfully.", HttpStatus.OK, categories).getBody());
    }
}
