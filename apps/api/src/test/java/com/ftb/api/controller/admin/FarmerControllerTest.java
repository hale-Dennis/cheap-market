package com.ftb.api.controller.admin;

import java.util.UUID;
import org.mockito.Mock;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
import com.ftb.api.config.SecurityConfig;
import com.ftb.api.service.FarmerService;
import org.springframework.http.MediaType;
import com.ftb.api.dto.response.FarmerResponse;
import com.ftb.api.exception.ConflictException;
import static org.mockito.ArgumentMatchers.any;
import org.springframework.data.domain.Pageable;
import com.ftb.api.dto.response.PaginatedResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ftb.api.dto.request.CreateFarmerRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


@WebMvcTest(FarmerController.class)
@Import(SecurityConfig.class)
class FarmerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Mock
    private FarmerService farmerService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void createFarmer_ValidRequest_ShouldReturn201Created() throws Exception {

        CreateFarmerRequest request = new CreateFarmerRequest("Test Farmer", "farmer@test.com", "5551234567", "Test Region");
        FarmerResponse farmerResponse = FarmerResponse.builder().id(UUID.randomUUID()).fullName(request.getFullName()).build();
        when(farmerService.createFarmer(any(CreateFarmerRequest.class))).thenReturn(farmerResponse);

        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.message").value("Farmer account created successfully."))
                .andExpect(jsonPath("$.data.fullName").value("Test Farmer"));
    }

    @Test
    @WithMockUser(roles = "BUYER")
    void createFarmer_NotAdmin_ShouldReturn403Forbidden() throws Exception {

        CreateFarmerRequest request = new CreateFarmerRequest("Test Farmer", "farmer@test.com", "5551234567", "Test Region");

        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createFarmer_DuplicateUser_ShouldReturn409Conflict() throws Exception {
        CreateFarmerRequest request = new CreateFarmerRequest("Test Farmer", "farmer@test.com", "5551234567", "Test Region");
        when(farmerService.createFarmer(any(CreateFarmerRequest.class)))
                .thenThrow(new ConflictException("A user with this email already exists."));

        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("A user with this email already exists."));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllFarmers_AsAdmin_ShouldReturn200OK() throws Exception {

        PaginatedResponse<FarmerResponse> paginatedResponse = PaginatedResponse.<FarmerResponse>builder()
                .content(Collections.singletonList(new FarmerResponse()))
                .currentPage(0)
                .totalPages(1)
                .totalElements(1L)
                .size(20)
                .build();
        when(farmerService.getAllFarmers(any(Pageable.class))).thenReturn(paginatedResponse);

        mockMvc.perform(get("/api/v1/admin/farmers?page=0&size=20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Successfully retrieved farmer list."))
                .andExpect(jsonPath("$.data.currentPage").value(0))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    void getAllFarmers_Unauthenticated_ShouldReturn401Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/farmers"))
                .andExpect(status().isUnauthorized());
    }
}