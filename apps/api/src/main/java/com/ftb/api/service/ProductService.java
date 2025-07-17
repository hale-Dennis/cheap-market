package com.ftb.api.service;

import com.ftb.api.dto.request.CreateProductRequest;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.dto.response.ProductCardResponse;
import com.ftb.api.dto.response.ProductDetailResponse;
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
import com.ftb.api.repository.specification.ProductSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;


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

    @Transactional(readOnly = true)
    public PaginatedResponse<ProductCardResponse> getPublicProducts(String region, Optional<UUID> categoryId, Pageable pageable) {
        Specification<Product> spec = ProductSpecification.hasStatus(ProductStatus.ACTIVE).and(ProductSpecification.inRegion(region));

        if (categoryId.isPresent()) {
            spec = spec.and(ProductSpecification.inCategory(categoryId.get()));
        }


        Page<Product> productPage = productRepository.findAll(spec, pageable);

        List<ProductCardResponse> productCards = productPage.getContent().stream()
                .map(productMapper::toProductCardResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<ProductCardResponse>builder()
                .content(productCards)
                .currentPage(productPage.getNumber())
                .totalPages(productPage.getTotalPages())
                .totalElements(productPage.getTotalElements())
                .size(productPage.getSize())
                .build();

    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getPublicProductById(UUID productId) {

        Product product = productRepository.findById(productId)
                .filter(p -> p.getListingStatus() == ProductStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Active product not found with id: " + productId));
        return productMapper.toProductDetailResponse(product);
    }
}
