package com.ftb.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ftb.api.config.SecurityConfig;
import com.ftb.api.dto.response.BuyerProfileResponse;
import com.ftb.api.service.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BuyerController.class)
@Import(SecurityConfig.class)
class BuyerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @Test
    @WithMockUser(roles = "BUYER")
    void getProfile_AsBuyer_ShouldReturn200OK() throws Exception {
        // Given
        when(userService.getBuyerProfile(anyString())).thenReturn(new BuyerProfileResponse());

        // When & Then
        mockMvc.perform(get("/api/v1/buyer/profile"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN") // A non-buyer role
    void getProfile_AsAdmin_ShouldReturn403Forbidden() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/buyer/profile"))
                .andExpect(status().isForbidden());
    }
}