package com.ftb.api.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.List;
import java.util.Optional;

import com.ftb.api.dto.request.PartialUpdateProductRequest;
import com.ftb.api.dto.request.UpdateProductRequest;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.model.User;
import com.ftb.api.model.UserRole;
import com.ftb.api.exception.BadRequestException;
import com.ftb.api.service.storage.ImageStorage;
import com.ftb.api.model.Product;
import com.ftb.api.model.Category;
import java.util.stream.Collectors;

import com.ftb.api.repository.*;
import lombok.RequiredArgsConstructor;
import com.ftb.api.model.ProductStatus;
import com.ftb.api.mapper.ProductMapper;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import com.ftb.api.dto.response.ProductResponse;
import org.springframework.data.domain.Pageable;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.dto.request.CreateProductRequest;
import com.ftb.api.dto.response.ProductCardResponse;
import com.ftb.api.dto.response.ProductDetailResponse;
import com.ftb.api.exception.ResourceNotFoundException;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;
import com.ftb.api.repository.specification.ProductSpecification;


@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final ImageStorage imageStorage;

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {

        User farmer = userRepository.findById(request.getFarmerId())
                .filter(user -> user.getRole() == UserRole.FARMER)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + request.getFarmerId()));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        requireManagedImageUrls(request.getImageUrls());
        requireRecentHarvest(request.getHarvestDate());

        Product product = productMapper.toProduct(request);

        product.setFarmer(farmer);
        product.setCategory(category);
        product.setName(request.getName().trim());
        product.setDescription(trimToNull(request.getDescription()));
        product.setUnit(request.getUnit().trim());
        product.setListingStatus(ProductStatus.ACTIVE);
        product.setStockQuantity(0);

        // Flush so the database-generated createdAt is populated in the response.
        Product savedProduct = productRepository.saveAndFlush(product);
        return productMapper.toProductResponse(savedProduct);
    }

    /** Only images uploaded through {@code /admin/uploads/images} may be attached to a listing. */
    private void requireManagedImageUrls(List<String> imageUrls) {
        if (imageUrls.stream().anyMatch(url -> !imageStorage.isManagedUrl(url))) {
            throw new BadRequestException("Images must be uploaded through the image upload endpoint.");
        }
    }

    /** Catches typos such as 2002 for 2026: produce harvested over a year ago isn't sold as fresh. */
    private static void requireRecentHarvest(LocalDate harvestDate) {
        if (harvestDate.isBefore(LocalDate.now().minusYears(1))) {
            throw new BadRequestException("Harvest date must be within the last year.");
        }
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ProductCardResponse> getPublicProducts(String region, Optional<UUID> categoryId, Pageable pageable) {
        Specification<Product> spec = ProductSpecification.hasStatus(ProductStatus.ACTIVE)
                .and(ProductSpecification.inRegion(region))
                .and(ProductSpecification.fromActiveFarmers());

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

    @Transactional(readOnly = true)
    public PaginatedResponse<ProductResponse> getAdminProducts(Pageable pageable) {
        Page<Product> productPage = productRepository.findAll(pageable);

        List<ProductResponse> productResponses = productPage.getContent().stream()
                .map(productMapper::toProductResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<ProductResponse>builder()
                .content(productResponses)
                .currentPage(productPage.getNumber())
                .totalPages(productPage.getTotalPages())
                .totalElements(productPage.getTotalElements())
                .size(productPage.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public ProductResponse getAdminProductById(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        return productMapper.toProductResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(UUID productId, UpdateProductRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        requireManagedImageUrls(request.getImageUrls());
        requireRecentHarvest(request.getHarvestDate());

        product.setCategory(category);
        product.setName(request.getName().trim());
        product.setDescription(trimToNull(request.getDescription()));
        product.setPrice(BigDecimal.valueOf(request.getPriceCents()).movePointLeft(2));
        product.setUnit(request.getUnit().trim());
        product.setHarvestDate(request.getHarvestDate());
        product.setImageUrls(request.getImageUrls());

        Product updatedProduct = productRepository.save(product);
        return productMapper.toProductResponse(updatedProduct);
    }

    @Transactional
    public ProductResponse partialUpdateProduct(UUID productId, PartialUpdateProductRequest request) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        if (request.getListingStatus() != null) {
            product.setListingStatus(request.getListingStatus());
        }
        if (request.getStockQuantity() != null) {
            product.setStockQuantity(request.getStockQuantity());
        }

        Product updatedProduct = productRepository.save(product);
        return productMapper.toProductResponse(updatedProduct);
    }

    @Transactional
    public void deleteProduct(UUID productId) {

        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }

        if (orderItemRepository.existsByProductId(productId)) {
            throw new ConflictException("Product cannot be deleted because it is part of an existing order.");
        }

        productRepository.deleteById(productId);
    }
}
