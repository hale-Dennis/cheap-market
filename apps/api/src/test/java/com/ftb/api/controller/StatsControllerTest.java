package com.ftb.api.controller;

import org.junit.jupiter.api.Test;
import com.ftb.api.service.JwtService;
import com.ftb.api.config.SecurityConfig;
import com.ftb.api.service.StatsService;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.config.JwtAuthenticationFilter;
import com.ftb.api.config.CustomAccessDeniedHandler;
import com.ftb.api.config.CustomAuthenticationEntryPoint;
import com.ftb.api.controller.admin.AdminStatsController;
import com.ftb.api.dto.response.AdminStatsResponse;
import com.ftb.api.dto.response.PublicStatsResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


/** The public home-page stats and the admin dashboard stats. */
@WebMvcTest(controllers = {StatsController.class, AdminStatsController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "application.security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw",
        "application.security.jwt.expiration=3600000"
})
class StatsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StatsService statsService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void publicStats_WithoutLogin_ShouldReturnCacheableCounts() throws Exception {
        when(statsService.getPublicStats()).thenReturn(new PublicStatsResponse(42, 7));

        mockMvc.perform(get("/api/v1/stats"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=300, public"))
                .andExpect(jsonPath("$.data.farmers").value(42))
                .andExpect(jsonPath("$.data.regions").value(7));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminStats_AsAdmin_ShouldReturnDashboardCounts() throws Exception {
        when(statsService.getAdminStats()).thenReturn(new AdminStatsResponse(12, 30, 4, 2));

        mockMvc.perform(get("/api/v1/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.farmers").value(12))
                .andExpect(jsonPath("$.data.liveListings").value(30))
                .andExpect(jsonPath("$.data.ordersInProgress").value(4))
                .andExpect(jsonPath("$.data.openDisputes").value(2));
    }

    @Test
    @WithMockUser(roles = "BUYER")
    void adminStats_AsBuyer_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats")).andExpect(status().isForbidden());

        verifyNoInteractions(statsService);
    }

    @Test
    void adminStats_WithoutLogin_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats")).andExpect(status().isUnauthorized());

        verifyNoInteractions(statsService);
    }
}
