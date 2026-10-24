package com.ftb.api.config;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import java.util.Collections;
import com.ftb.api.model.User;
import com.ftb.api.model.UserRole;
import org.junit.jupiter.api.Test;
import com.ftb.api.service.JwtService;
import com.ftb.api.model.AccountStatus;
import com.ftb.api.service.FarmerService;
import com.ftb.api.service.CategoryService;
import com.ftb.api.repository.UserRepository;
import org.springframework.http.MediaType;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import com.ftb.api.controller.admin.FarmerController;
import com.ftb.api.controller.admin.CategoryController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


/**
 * Verifies that admin routes are protected end-to-end by the real JWT filter and security rules.
 */
@WebMvcTest(controllers = {CategoryController.class, FarmerController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "application.security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw",
        "application.security.jwt.expiration=3600000"
})
class AdminRouteSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private CategoryService categoryService;

    @MockitoBean
    private FarmerService farmerService;

    @Test
    void adminRoute_WithoutToken_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/categories"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminRoute_WithMalformedToken_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/categories")
                        .header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminRoute_WithAdminToken_ShouldReturn200() throws Exception {
        String token = tokenFor("admin@test.com", UserRole.ADMIN);
        when(categoryService.getAllCategories()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void adminRoute_WithBuyerToken_ShouldReturn403() throws Exception {
        String token = tokenFor("buyer@test.com", UserRole.BUYER);

        mockMvc.perform(get("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRouteWithoutMethodSecurity_WithBuyerToken_ShouldReturn403() throws Exception {
        String token = tokenFor("buyer@test.com", UserRole.BUYER);

        mockMvc.perform(put("/api/v1/admin/farmers/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(farmerService);
    }

    private String tokenFor(String email, UserRole role) {
        User user = User.builder()
                .email(email)
                .passwordHash("hashed")
                .role(role)
                .accountStatus(AccountStatus.ACTIVE)
                .build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                email, "hashed", Collections.singleton(new SimpleGrantedAuthority("ROLE_" + role.name())));
        return jwtService.generateToken(userDetails);
    }
}
