package com.ftb.api.controller;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import com.ftb.api.service.JwtService;
import com.ftb.api.config.SecurityConfig;
import com.ftb.api.service.ProductService;
import com.ftb.api.service.CategoryService;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.config.JwtAuthenticationFilter;
import com.ftb.api.config.CustomAccessDeniedHandler;
import com.ftb.api.config.CustomAuthenticationEntryPoint;
import com.ftb.api.dto.response.CategoryResponse;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.dto.response.ProductCardResponse;
import com.ftb.api.dto.response.ProductDetailResponse;
import com.ftb.api.dto.response.FarmerInfo;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


/** The public catalog endpoints, called without any authentication. */
@WebMvcTest(controllers = {PublicProductController.class, PublicCategoryController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "application.security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw",
        "application.security.jwt.expiration=3600000"
})
class PublicCatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private CategoryService categoryService;

    @MockitoBean
    private UserRepository userRepository;

    private static PaginatedResponse<ProductCardResponse> onePage() {
        ProductCardResponse card = ProductCardResponse.builder()
                .id(UUID.randomUUID()).name("Okro").priceCents(1000).unit("per kg").build();
        return PaginatedResponse.<ProductCardResponse>builder()
                .content(List.of(card)).currentPage(0).totalPages(1).totalElements(1).size(20).build();
    }

    @Test
    void listProducts_WithoutLogin_ShouldReturnCacheablePageNewestFirst() throws Exception {
        when(productService.getPublicProducts(eq("VOLTA"), eq(Optional.empty()), any(Pageable.class))).thenReturn(onePage());

        mockMvc.perform(get("/api/v1/products").param("region", "VOLTA"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=300, public"))
                .andExpect(jsonPath("$.data.content[0].name").value("Okro"))
                .andExpect(jsonPath("$.data.content[0].priceCents").value(1000));

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(productService).getPublicProducts(eq("VOLTA"), eq(Optional.empty()), pageable.capture());
        assertEquals(0, pageable.getValue().getPageNumber());
        assertEquals(20, pageable.getValue().getPageSize());
        assertEquals(PublicProductController.CATALOG_ORDER, pageable.getValue().getSort());
    }

    @Test
    void listProducts_WithCategoryAndPage_ShouldPassThemOn() throws Exception {
        UUID categoryId = UUID.randomUUID();
        when(productService.getPublicProducts(eq("ASHANTI"), eq(Optional.of(categoryId)), any(Pageable.class))).thenReturn(onePage());

        mockMvc.perform(get("/api/v1/products")
                        .param("region", "ASHANTI")
                        .param("categoryId", categoryId.toString())
                        .param("page", "2"))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(productService).getPublicProducts(eq("ASHANTI"), eq(Optional.of(categoryId)), pageable.capture());
        assertEquals(2, pageable.getValue().getPageNumber());
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "                                  | Required request parameter 'region'",
            "region=Kumasi                     | region: Region must be one of Ghana's regions",
            "region=VOLTA&page=-1              | page: must be 0 or greater",
            "region=VOLTA&size=101             | size: must be at most 100",
            "region=VOLTA&categoryId=not-a-uuid | Invalid value 'not-a-uuid' for parameter 'categoryId'"
    })
    void listProducts_InvalidParams_ShouldReturn400(String query, String expectedMessage) throws Exception {
        mockMvc.perform(get("/api/v1/products?" + (query == null ? "" : query)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString(expectedMessage)));

        verifyNoInteractions(productService);
    }

    @Test
    void productDetail_WithoutLogin_ShouldReturnCacheableDetail() throws Exception {
        UUID id = UUID.randomUUID();
        when(productService.getPublicProductById(id)).thenReturn(ProductDetailResponse.builder()
                .id(id).name("Tomatoes").priceCents(1850).unit("per kg")
                .farmer(FarmerInfo.builder().fullName("Ama Mensah").averageRating(4.5).ratingCount(12).build())
                .build());

        mockMvc.perform(get("/api/v1/products/" + id))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=300, public"))
                .andExpect(jsonPath("$.data.priceCents").value(1850))
                .andExpect(jsonPath("$.data.farmer.fullName").value("Ama Mensah"))
                .andExpect(jsonPath("$.data.farmer.ratingCount").value(12));
    }

    @Test
    void productDetail_NotFound_ShouldReturn404() throws Exception {
        UUID id = UUID.randomUUID();
        when(productService.getPublicProductById(id))
                .thenThrow(new com.ftb.api.exception.ResourceNotFoundException("Product not found with id: " + id));

        mockMvc.perform(get("/api/v1/products/" + id))
                .andExpect(status().isNotFound())
                // A missing product must not be cached as if it were catalog data.
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("public"))));
    }

    @Test
    void productDetail_InvalidId_ShouldReturn400() throws Exception {
        mockMvc.perform(get("/api/v1/products/not-a-uuid"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(productService);
    }

    @Test
    void listCategories_WithoutLogin_ShouldReturnThem() throws Exception {
        when(categoryService.getAllCategories()).thenReturn(List.of(new CategoryResponse(UUID.randomUUID(), "Fruits")));

        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=300, public"))
                .andExpect(jsonPath("$.data[0].name").value("Fruits"));
    }
}
