package com.ftb.api.service;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import java.time.LocalDate;
import java.math.BigDecimal;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import com.ftb.api.model.User;
import com.ftb.api.model.Product;
import com.ftb.api.model.Category;
import com.ftb.api.model.UserRole;
import com.ftb.api.model.ProductStatus;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.mapper.ProductMapper;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.repository.ProductRepository;
import com.ftb.api.repository.CategoryRepository;
import com.ftb.api.repository.OrderItemRepository;
import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.*;
import com.ftb.api.exception.BadRequestException;
import com.ftb.api.dto.response.ProductResponse;
import com.ftb.api.service.storage.ImageStorage;
import com.ftb.api.dto.request.CreateProductRequest;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import com.ftb.api.exception.ResourceNotFoundException;


@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ProductMapper productMapper;
    @Mock
    private ImageStorage imageStorage;

    @InjectMocks
    private ProductService productService;

    private final User farmer = User.builder().id(UUID.randomUUID()).role(UserRole.FARMER).build();
    private final Category category = Category.builder().id(UUID.randomUUID()).name("Vegetables").build();
    private static final String IMAGE = "/api/v1/media/00000000-0000-0000-0000-000000000000.jpg";

    private CreateProductRequest request() {
        return CreateProductRequest.builder()
                .farmerId(farmer.getId())
                .categoryId(category.getId())
                .name("  Organic Tomatoes ")
                .description("  Fresh tomatoes. ")
                .priceCents(1500)
                .unit(" per kg ")
                .harvestDate(LocalDate.now().minusDays(1))
                .imageUrls(List.of(IMAGE))
                .build();
    }

    @BeforeEach
    void defaults() {
        lenient().when(userRepository.findById(farmer.getId())).thenReturn(Optional.of(farmer));
        lenient().when(categoryRepository.findById(category.getId())).thenReturn(Optional.of(category));
        lenient().when(imageStorage.isManagedUrl(IMAGE)).thenReturn(true);
        lenient().when(productMapper.toProduct(any(CreateProductRequest.class)))
                .thenAnswer(invocation -> Product.builder()
                        .price(BigDecimal.valueOf(invocation.<CreateProductRequest>getArgument(0).getPriceCents()).movePointLeft(2))
                        .harvestDate(invocation.<CreateProductRequest>getArgument(0).getHarvestDate())
                        .imageUrls(invocation.<CreateProductRequest>getArgument(0).getImageUrls())
                        .build());
    }

    @Test
    void createProduct_ShouldSaveActiveListingLinkedToFarmerAndCategory() {
        when(productRepository.saveAndFlush(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ProductResponse expected = new ProductResponse();
        when(productMapper.toProductResponse(any(Product.class))).thenReturn(expected);

        assertSame(expected, productService.createProduct(request()));

        ArgumentCaptor<Product> saved = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).saveAndFlush(saved.capture());
        Product product = saved.getValue();
        assertSame(farmer, product.getFarmer());
        assertSame(category, product.getCategory());
        assertEquals("Organic Tomatoes", product.getName());
        assertEquals("Fresh tomatoes.", product.getDescription());
        assertEquals("per kg", product.getUnit());
        assertEquals(new BigDecimal("15.00"), product.getPrice());
        assertEquals(List.of(IMAGE), product.getImageUrls());
        assertEquals(ProductStatus.ACTIVE, product.getListingStatus());
        assertEquals(0, product.getStockQuantity());
    }

    @Test
    void createProduct_BlankDescription_ShouldBeStoredAsNull() {
        CreateProductRequest request = request();
        request.setDescription("   ");
        when(productRepository.saveAndFlush(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productService.createProduct(request);

        ArgumentCaptor<Product> saved = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).saveAndFlush(saved.capture());
        assertNull(saved.getValue().getDescription());
    }

    @Test
    void createProduct_ForNonFarmerUser_ShouldThrowNotFound() {
        User buyer = User.builder().id(UUID.randomUUID()).role(UserRole.BUYER).build();
        when(userRepository.findById(buyer.getId())).thenReturn(Optional.of(buyer));
        CreateProductRequest request = request();
        request.setFarmerId(buyer.getId());

        assertThrows(ResourceNotFoundException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).saveAndFlush(any());
    }

    @Test
    void createProduct_UnknownCategory_ShouldThrowNotFound() {
        CreateProductRequest request = request();
        request.setCategoryId(UUID.randomUUID());
        when(categoryRepository.findById(request.getCategoryId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).saveAndFlush(any());
    }

    @Test
    void createProduct_ImageNotUploadedThroughUs_ShouldThrowBadRequest() {
        CreateProductRequest request = request();
        request.setImageUrls(List.of(IMAGE, "https://evil.example/tomato.jpg"));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> productService.createProduct(request));
        assertEquals("Images must be uploaded through the image upload endpoint.", ex.getMessage());
        verify(productRepository, never()).saveAndFlush(any());
    }

    @Test
    void createProduct_HarvestedMoreThanAYearAgo_ShouldThrowBadRequest() {
        CreateProductRequest request = request();
        request.setHarvestDate(LocalDate.now().minusYears(1).minusDays(1));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> productService.createProduct(request));
        assertEquals("Harvest date must be within the last year.", ex.getMessage());
    }

    @Test
    void createProduct_HarvestedToday_ShouldBeAccepted() {
        CreateProductRequest request = request();
        request.setHarvestDate(LocalDate.now());
        when(productRepository.saveAndFlush(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productService.createProduct(request);

        verify(productRepository).saveAndFlush(any(Product.class));
    }
}
