package com.ftb.api.controller.admin;

import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import com.ftb.api.model.ProductStatus;
import org.junit.jupiter.api.Test;
import com.ftb.api.service.JwtService;
import com.ftb.api.config.SecurityConfig;
import com.ftb.api.service.ProductService;
import com.ftb.api.service.ImageUploadService;
import org.springframework.http.MediaType;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.config.JwtAuthenticationFilter;
import com.ftb.api.config.CustomAccessDeniedHandler;
import com.ftb.api.config.CustomAuthenticationEntryPoint;
import com.ftb.api.dto.response.ProductResponse;
import com.ftb.api.exception.BadRequestException;
import com.ftb.api.dto.request.CreateProductRequest;
import com.ftb.api.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


@WebMvcTest(controllers = {ProductController.class, ImageUploadController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "application.security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw",
        "application.security.jwt.expiration=3600000"
})
@WithMockUser(roles = "ADMIN")
class ProductControllerTest {

    private static final String IMAGE = "/api/v1/media/00000000-0000-0000-0000-000000000000.jpg";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private ImageUploadService imageUploadService;

    @MockitoBean
    private UserRepository userRepository;

    private static CreateProductRequest validRequest() {
        return CreateProductRequest.builder()
                .farmerId(UUID.randomUUID())
                .categoryId(UUID.randomUUID())
                .name("Organic Tomatoes")
                .description("Fresh organic tomatoes.")
                .priceCents(1500)
                .unit("per kg")
                .harvestDate(LocalDate.now())
                .imageUrls(List.of(IMAGE))
                .build();
    }

    private org.springframework.test.web.servlet.ResultActions postProduct(Object body) throws Exception {
        return mockMvc.perform(post("/api/v1/admin/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    @Test
    void create_ValidRequest_ShouldReturn201WithListing() throws Exception {
        CreateProductRequest request = validRequest();
        ProductResponse response = ProductResponse.builder()
                .id(UUID.randomUUID())
                .farmerId(request.getFarmerId())
                .categoryId(request.getCategoryId())
                .name("Organic Tomatoes")
                .priceCents(1500)
                .unit("per kg")
                .harvestDate(request.getHarvestDate())
                .imageUrls(List.of(IMAGE))
                .listingStatus(ProductStatus.ACTIVE)
                .build();
        when(productService.createProduct(any(CreateProductRequest.class))).thenReturn(response);

        postProduct(request)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Product listing created successfully."))
                .andExpect(jsonPath("$.data.priceCents").value(1500))
                .andExpect(jsonPath("$.data.listingStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.data.imageUrls[0]").value(IMAGE));
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "price-zero      | priceCents: Price must be greater than zero",
            "price-negative  | priceCents: Price must be greater than zero",
            "no-images       | imageUrls: A listing must have between 1 and 5 images",
            "six-images      | imageUrls: A listing must have between 1 and 5 images",
            "future-harvest  | harvestDate: Harvest date cannot be in the future",
            "blank-name      | name: Product name cannot be blank",
            "long-name       | name: Product name must be at most 100 characters",
            "blank-unit      | unit: Unit of measure cannot be blank",
            "no-farmer       | farmerId: Farmer ID cannot be null"
    })
    void create_InvalidField_ShouldReturn400(String scenario, String expectedMessage) throws Exception {
        CreateProductRequest request = validRequest();
        switch (scenario) {
            case "price-zero" -> request.setPriceCents(0);
            case "price-negative" -> request.setPriceCents(-100);
            case "no-images" -> request.setImageUrls(List.of());
            case "six-images" -> request.setImageUrls(java.util.Collections.nCopies(6, IMAGE));
            case "future-harvest" -> request.setHarvestDate(LocalDate.now().plusDays(1));
            case "blank-name" -> request.setName(" ");
            case "long-name" -> request.setName("x".repeat(101));
            case "blank-unit" -> request.setUnit("");
            case "no-farmer" -> request.setFarmerId(null);
            default -> throw new IllegalArgumentException(scenario);
        }

        postProduct(request)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString(expectedMessage)));

        verifyNoInteractions(productService);
    }

    @Test
    void create_UnknownFarmer_ShouldReturn404() throws Exception {
        when(productService.createProduct(any(CreateProductRequest.class)))
                .thenThrow(new ResourceNotFoundException("Farmer not found with id: x"));

        postProduct(validRequest()).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "BUYER")
    void create_AsBuyer_ShouldReturn403() throws Exception {
        postProduct(validRequest()).andExpect(status().isForbidden());
        verifyNoInteractions(productService);
    }

    @Test
    void uploadImages_ShouldReturn201WithUrls() throws Exception {
        UUID farmerId = UUID.randomUUID();
        when(imageUploadService.uploadListingImages(eq(farmerId), anyList())).thenReturn(List.of(IMAGE));

        mockMvc.perform(multipart("/api/v1/admin/uploads/images")
                        .file(new MockMultipartFile("files", "a.jpg", "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}))
                        .param("farmerId", farmerId.toString()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.urls[0]").value(IMAGE));
    }

    @Test
    void uploadImages_InvalidImage_ShouldReturn400WithReason() throws Exception {
        UUID farmerId = UUID.randomUUID();
        when(imageUploadService.uploadListingImages(eq(farmerId), anyList()))
                .thenThrow(new BadRequestException("\"a.gif\" must be a JPEG or PNG image."));

        mockMvc.perform(multipart("/api/v1/admin/uploads/images")
                        .file(new MockMultipartFile("files", "a.gif", "image/gif", "GIF89a".getBytes()))
                        .param("farmerId", farmerId.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("\"a.gif\" must be a JPEG or PNG image."));
    }

    @Test
    void uploadImages_WithoutFiles_ShouldReturn400() throws Exception {
        mockMvc.perform(multipart("/api/v1/admin/uploads/images").param("farmerId", UUID.randomUUID().toString()))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(imageUploadService);
    }

    @Test
    @WithMockUser(roles = "BUYER")
    void uploadImages_AsBuyer_ShouldReturn403() throws Exception {
        mockMvc.perform(multipart("/api/v1/admin/uploads/images")
                        .file(new MockMultipartFile("files", "a.jpg", "image/jpeg", new byte[]{1}))
                        .param("farmerId", UUID.randomUUID().toString()))
                .andExpect(status().isForbidden());

        verifyNoInteractions(imageUploadService);
    }
}
