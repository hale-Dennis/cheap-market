package com.ftb.api.controller.admin;

import java.util.UUID;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import com.ftb.api.config.SecurityConfig;
import com.ftb.api.service.JwtService;
import com.ftb.api.service.FarmerService;
import org.springframework.http.MediaType;
import com.ftb.api.model.AccountStatus;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.config.JwtAuthenticationFilter;
import com.ftb.api.config.CustomAccessDeniedHandler;
import com.ftb.api.config.CustomAuthenticationEntryPoint;
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
import org.springframework.test.context.TestPropertySource;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


@WebMvcTest(FarmerController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "application.security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw",
        "application.security.jwt.expiration=3600000"
})
class FarmerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private FarmerService farmerService;

    @MockitoBean
    private UserRepository userRepository;

    private static CreateFarmerRequest validRequest() {
        return new CreateFarmerRequest("Ama Mensah", "ama@test.com", "0241234567", "ASHANTI");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createFarmer_ValidRequest_ShouldReturn201Created() throws Exception {
        FarmerResponse farmerResponse = FarmerResponse.builder()
                .id(UUID.randomUUID())
                .fullName("Ama Mensah")
                .email("ama@test.com")
                .phoneNumber("+233241234567")
                .region("ASHANTI")
                .accountStatus(AccountStatus.ACTIVE)
                .build();
        when(farmerService.createFarmer(any(CreateFarmerRequest.class))).thenReturn(farmerResponse);

        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.message").value("Farmer account created successfully."))
                .andExpect(jsonPath("$.data.fullName").value("Ama Mensah"))
                .andExpect(jsonPath("$.data.phoneNumber").value("+233241234567"))
                .andExpect(jsonPath("$.data.region").value("ASHANTI"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createFarmer_MissingFields_ShouldReturn400() throws Exception {
        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        verifyNoInteractions(farmerService);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createFarmer_InvalidRegion_ShouldReturn400() throws Exception {
        CreateFarmerRequest request = validRequest();
        request.setRegion("Test Region");

        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("region")));

        verifyNoInteractions(farmerService);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createFarmer_InvalidPhoneNumber_ShouldReturn400() throws Exception {
        CreateFarmerRequest request = validRequest();
        request.setPhoneNumber("12345");

        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("phoneNumber")));

        verifyNoInteractions(farmerService);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createFarmer_InvalidEmail_ShouldReturn400() throws Exception {
        CreateFarmerRequest request = validRequest();
        request.setEmail("not-an-email");

        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(farmerService);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createFarmer_DuplicateUser_ShouldReturn409Conflict() throws Exception {
        when(farmerService.createFarmer(any(CreateFarmerRequest.class)))
                .thenThrow(new ConflictException("A user with this email already exists."));

        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("A user with this email already exists."));
    }

    @Test
    @WithMockUser(roles = "BUYER")
    void createFarmer_NotAdmin_ShouldReturn403Forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isForbidden());

        verifyNoInteractions(farmerService);
    }

    @Test
    void createFarmer_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(farmerService);
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
