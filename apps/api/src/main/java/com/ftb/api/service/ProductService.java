package com.ftb.api.service;

import com.ftb.api.dto.request.CreateProductRequest;
import com.ftb.api.dto.response.ProductResponse;
import com.ftb.api.exception.ResourceNotFoundException;
import com.ftb.api.mapper.ProductMapper;
import com.ftb.api.model.Category;
import com.ftb.api.model.Product;
import com.ftb.api.model.ProductStatus;
import com.ftb.api.model.User;
import com.ftb.api.repository.CategoryRepository;
import com.ftb.api.repository.ProductRepository;
import com.ftb.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {

        User farmer = userRepository.findById(request.getFarmerId())
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + request.getFarmerId()));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Product product = productMapper.toProduct(request);

        product.setFarmer(farmer);
        product.setCategory(category);
        product.setListingStatus(ProductStatus.ACTIVE);

        Product savedProduct = productRepository.save(product);
        return productMapper.toProductResponse(savedProduct);
    }
}
