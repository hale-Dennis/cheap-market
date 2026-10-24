package com.ftb.api.controller.admin;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import com.ftb.api.service.JwtService;
import com.ftb.api.config.SecurityConfig;
import com.ftb.api.service.CategoryService;
import org.springframework.http.MediaType;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.config.JwtAuthenticationFilter;
import com.ftb.api.config.CustomAccessDeniedHandler;
import com.ftb.api.config.CustomAuthenticationEntryPoint;
import com.ftb.api.dto.request.CategoryRequest;
import com.ftb.api.dto.response.CategoryResponse;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


@WebMvcTest(CategoryController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "application.security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw",
        "application.security.jwt.expiration=3600000"
})
@WithMockUser(roles = "ADMIN")
class CategoryControllerTest {

    private static final String BASE = "/api/v1/admin/categories";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CategoryService categoryService;

    @MockitoBean
    private UserRepository userRepository;

    private String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    @Test
    void list_ShouldReturnCategories() throws Exception {
        UUID id = UUID.randomUUID();
        when(categoryService.getAllCategories()).thenReturn(List.of(new CategoryResponse(id, "Fruits")));

        mockMvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(id.toString()))
                .andExpect(jsonPath("$.data[0].name").value("Fruits"));
    }

    @Test
    void create_ValidName_ShouldReturn201() throws Exception {
        UUID id = UUID.randomUUID();
        when(categoryService.createCategory(any(CategoryRequest.class))).thenReturn(new CategoryResponse(id, "Fruits"));

        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(json(new CategoryRequest("Fruits"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Category created successfully."))
                .andExpect(jsonPath("$.data.name").value("Fruits"));
    }

    @Test
    void create_BlankName_ShouldReturn400() throws Exception {
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(json(new CategoryRequest("   "))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Category name cannot be blank")));

        verifyNoInteractions(categoryService);
    }

    @Test
    void create_NameLongerThan50_ShouldReturn400() throws Exception {
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(json(new CategoryRequest("x".repeat(51)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("must not exceed 50 characters")));

        verifyNoInteractions(categoryService);
    }

    @Test
    void create_Duplicate_ShouldReturn409() throws Exception {
        when(categoryService.createCategory(any(CategoryRequest.class)))
                .thenThrow(new ConflictException("A category with this name already exists."));

        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(json(new CategoryRequest("Fruits"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A category with this name already exists."));
    }

    @Test
    void update_ShouldReturnRenamedCategory() throws Exception {
        UUID id = UUID.randomUUID();
        when(categoryService.updateCategory(eq(id), any(CategoryRequest.class))).thenReturn(new CategoryResponse(id, "Leafy Greens"));

        mockMvc.perform(put(BASE + "/" + id).contentType(MediaType.APPLICATION_JSON).content(json(new CategoryRequest("Leafy Greens"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Leafy Greens"));
    }

    @Test
    void update_UnknownId_ShouldReturn404() throws Exception {
        UUID id = UUID.randomUUID();
        when(categoryService.updateCategory(eq(id), any(CategoryRequest.class)))
                .thenThrow(new ResourceNotFoundException("Category not found with id: " + id));

        mockMvc.perform(put(BASE + "/" + id).contentType(MediaType.APPLICATION_JSON).content(json(new CategoryRequest("Fruits"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_InvalidId_ShouldReturn400() throws Exception {
        mockMvc.perform(put(BASE + "/not-a-uuid").contentType(MediaType.APPLICATION_JSON).content(json(new CategoryRequest("Fruits"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void delete_ShouldReturn204() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete(BASE + "/" + id))
                .andExpect(status().isNoContent());

        verify(categoryService).deleteCategory(id);
    }

    @Test
    void delete_UsedByProducts_ShouldReturn409() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ConflictException("This category is used by produce listings and cannot be deleted."))
                .when(categoryService).deleteCategory(id);

        mockMvc.perform(delete(BASE + "/" + id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This category is used by produce listings and cannot be deleted."));
    }

    @Test
    @WithMockUser(roles = "BUYER")
    void anyEndpoint_AsBuyer_ShouldReturn403() throws Exception {
        mockMvc.perform(get(BASE)).andExpect(status().isForbidden());
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(json(new CategoryRequest("Fruits"))))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete(BASE + "/" + UUID.randomUUID())).andExpect(status().isForbidden());

        verifyNoInteractions(categoryService);
    }
}
