package com.ftb.api.controller;

import com.ftb.api.model.Address;
import org.junit.jupiter.api.Test;
import com.ftb.api.service.JwtService;
import com.ftb.api.service.UserService;
import com.ftb.api.config.SecurityConfig;
import org.springframework.http.MediaType;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.config.JwtAuthenticationFilter;
import com.ftb.api.config.CustomAccessDeniedHandler;
import com.ftb.api.config.CustomAuthenticationEntryPoint;
import com.ftb.api.dto.response.BuyerProfileResponse;
import com.ftb.api.dto.request.UpdateBuyerProfileRequest;
import com.ftb.api.dto.request.AddressRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


@WebMvcTest(BuyerController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "application.security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw",
        "application.security.jwt.expiration=3600000"
})
class BuyerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private UserRepository userRepository;

    private static final BuyerProfileResponse PROFILE = BuyerProfileResponse.builder()
            .fullName("Jane Doe")
            .email("jane@example.com")
            .region("ASHANTI")
            .deliveryAddress(new Address("123 Market Rd", "Kumasi", "AK-123-4567"))
            .build();

    private static UpdateBuyerProfileRequest validUpdate() {
        return new UpdateBuyerProfileRequest("Jane Doe", "ASHANTI",
                new AddressRequest("123 Market Rd", "Kumasi", "AK-123-4567"));
    }

    @Test
    @WithMockUser(username = "jane@example.com", roles = "BUYER")
    void getProfile_AsBuyer_ShouldReturnTheirProfile() throws Exception {
        when(userService.getBuyerProfile("jane@example.com")).thenReturn(PROFILE);

        mockMvc.perform(get("/api/v1/buyer/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Jane Doe"))
                .andExpect(jsonPath("$.data.email").value("jane@example.com"))
                .andExpect(jsonPath("$.data.region").value("ASHANTI"))
                .andExpect(jsonPath("$.data.deliveryAddress.town").value("Kumasi"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getProfile_AsAdmin_ShouldReturn403Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/buyer/profile"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(userService);
    }

    @Test
    void getProfile_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/buyer/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "jane@example.com", roles = "BUYER")
    void updateProfile_ValidRequest_ShouldReturnUpdatedProfile() throws Exception {
        when(userService.updateBuyerProfile(eq("jane@example.com"), any(UpdateBuyerProfileRequest.class)))
                .thenReturn(PROFILE);

        mockMvc.perform(put("/api/v1/buyer/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validUpdate())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Profile updated successfully."))
                .andExpect(jsonPath("$.data.deliveryAddress.gpsAddress").value("AK-123-4567"));
    }

    @Test
    @WithMockUser(username = "jane@example.com", roles = "BUYER")
    void updateProfile_WithoutDeliveryAddress_ShouldBeAccepted() throws Exception {
        UpdateBuyerProfileRequest request = validUpdate();
        request.setDeliveryAddress(null);
        when(userService.updateBuyerProfile(eq("jane@example.com"), any(UpdateBuyerProfileRequest.class)))
                .thenReturn(PROFILE);

        mockMvc.perform(put("/api/v1/buyer/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "fullName |      | fullName: Full name cannot be blank",
            "region   | Kumasi | region: Region must be one of Ghana's regions",
            "street   |      | deliveryAddress.street: Street cannot be blank",
            "town     |      | deliveryAddress.town: Town cannot be blank",
            "gps      | 12345 | deliveryAddress.gpsAddress: GPS address must look like AK-484-9321"
    })
    @WithMockUser(username = "jane@example.com", roles = "BUYER")
    void updateProfile_InvalidField_ShouldReturn400(String field, String value, String expectedMessage) throws Exception {
        UpdateBuyerProfileRequest request = validUpdate();
        switch (field) {
            case "fullName" -> request.setFullName(value);
            case "region" -> request.setRegion(value);
            case "street" -> request.getDeliveryAddress().setStreet(value);
            case "town" -> request.getDeliveryAddress().setTown(value);
            case "gps" -> request.getDeliveryAddress().setGpsAddress(value);
            default -> throw new IllegalArgumentException(field);
        }

        mockMvc.perform(put("/api/v1/buyer/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString(expectedMessage)));

        verifyNoInteractions(userService);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateProfile_AsAdmin_ShouldReturn403Forbidden() throws Exception {
        mockMvc.perform(put("/api/v1/buyer/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validUpdate())))
                .andExpect(status().isForbidden());

        verifyNoInteractions(userService);
    }
}
