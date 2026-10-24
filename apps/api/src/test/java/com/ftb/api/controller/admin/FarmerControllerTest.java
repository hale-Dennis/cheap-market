package com.ftb.api.controller.admin;

import java.util.UUID;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.assertEquals;
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
    void createFarmer_WithoutEmail_ShouldReturn201Created() throws Exception {
        CreateFarmerRequest request = validRequest();
        request.setEmail(null);
        when(farmerService.createFarmer(any(CreateFarmerRequest.class)))
                .thenReturn(FarmerResponse.builder().fullName("Ama Mensah").build());

        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createFarmer_WithoutPhoneNumber_ShouldReturn400() throws Exception {
        CreateFarmerRequest request = validRequest();
        request.setPhoneNumber(null);

        mockMvc.perform(post("/api/v1/admin/farmers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Phone number cannot be blank")));

        verifyNoInteractions(farmerService);
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

        mockMvc.perform(get("/api/v1/admin/farmers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Successfully retrieved farmer list."))
                .andExpect(jsonPath("$.data.currentPage").value(0))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(farmerService).getAllFarmers(pageable.capture());
        assertEquals(0, pageable.getValue().getPageNumber());
        assertEquals(20, pageable.getValue().getPageSize());
        assertEquals(FarmerController.FARMER_ORDER, pageable.getValue().getSort());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllFarmers_WithPageAndSize_ShouldRequestThatPage() throws Exception {
        when(farmerService.getAllFarmers(any(Pageable.class))).thenReturn(new PaginatedResponse<>());

        mockMvc.perform(get("/api/v1/admin/farmers?page=3&size=100"))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(farmerService).getAllFarmers(pageable.capture());
        assertEquals(3, pageable.getValue().getPageNumber());
        assertEquals(100, pageable.getValue().getPageSize());
    }

    @ParameterizedTest
    @CsvSource({
            "page=-1, page: must be 0 or greater",
            "size=0, size: must be at least 1",
            "size=101, size: must be at most 100",
            "page=abc, Invalid value 'abc' for parameter 'page'.",
            "size=ten, Invalid value 'ten' for parameter 'size'."
    })
    @WithMockUser(roles = "ADMIN")
    void getAllFarmers_InvalidPagingParams_ShouldReturn400(String query, String expectedMessage) throws Exception {
        mockMvc.perform(get("/api/v1/admin/farmers?" + query))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString(expectedMessage)));

        verifyNoInteractions(farmerService);
    }

    @Test
    @WithMockUser(roles = "BUYER")
    void getAllFarmers_NotAdmin_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/farmers"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(farmerService);
    }

    @Test
    void getAllFarmers_Unauthenticated_ShouldReturn401Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/farmers"))
                .andExpect(status().isUnauthorized());
    }
}
