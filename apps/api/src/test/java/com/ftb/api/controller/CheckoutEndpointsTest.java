package com.ftb.api.controller;

import java.util.List;
import java.util.UUID;
import com.ftb.api.model.Address;
import org.junit.jupiter.api.Test;
import com.ftb.api.service.JwtService;
import com.ftb.api.config.SecurityConfig;
import com.ftb.api.service.DeliveryFeeService;
import com.ftb.api.service.PickupLocationService;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.config.JwtAuthenticationFilter;
import com.ftb.api.config.CustomAccessDeniedHandler;
import com.ftb.api.config.CustomAuthenticationEntryPoint;
import com.ftb.api.controller.admin.AdminPickupLocationController;
import com.ftb.api.dto.response.PickupLocationResponseDto;
import org.springframework.http.MediaType;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


/** Endpoints the checkout page uses: delivery fee (public) and pickup locations (buyers). */
@WebMvcTest(controllers = {DeliveryFeeController.class, PickupLocationController.class, AdminPickupLocationController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "application.security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw",
        "application.security.jwt.expiration=3600000"
})
class CheckoutEndpointsTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DeliveryFeeService deliveryFeeService;

    @MockitoBean
    private PickupLocationService pickupLocationService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void deliveryFee_WithoutLogin_ShouldReturnCacheableFee() throws Exception {
        when(deliveryFeeService.feeCentsFor("VOLTA")).thenReturn(1000);

        mockMvc.perform(get("/api/v1/delivery-fees").param("region", "VOLTA"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=300, public"))
                .andExpect(jsonPath("$.data.region").value("VOLTA"))
                .andExpect(jsonPath("$.data.feeCents").value(1000));
    }

    @Test
    void wrongMethod_ShouldReturn405WithAllowHeaderNot500() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/delivery-fees").param("region", "VOLTA"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().string("Allow", org.hamcrest.Matchers.containsString("GET")))
                .andExpect(jsonPath("$.status").value(405));
    }

    @Test
    @WithMockUser(roles = "BUYER")
    void unknownPath_ForSignedInUser_ShouldReturn404Not500() throws Exception {
        mockMvc.perform(get("/api/v1/delivery-fees/extra/segments"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void unsupportedContentType_ShouldReturn415Not500() throws Exception {
        mockMvc.perform(post("/api/v1/admin/pickup-locations").contentType(MediaType.TEXT_PLAIN).content("x"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void deliveryFee_InvalidOrMissingRegion_ShouldReturn400() throws Exception {
        mockMvc.perform(get("/api/v1/delivery-fees").param("region", "Kumasi")).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/delivery-fees")).andExpect(status().isBadRequest());

        verifyNoInteractions(deliveryFeeService);
    }

    @Test
    @WithMockUser(roles = "BUYER")
    void pickupLocations_AsBuyer_ShouldReturnPrivatelyCacheableList() throws Exception {
        PickupLocationResponseDto location = PickupLocationResponseDto.builder()
                .id(UUID.randomUUID()).name("Ho Market").region("VOLTA")
                .address(new Address("Market Rd", "Ho", null)).operatingHours("Mon–Sat 7am–6pm").build();
        when(pickupLocationService.getLocationsByRegion("VOLTA")).thenReturn(List.of(location));

        mockMvc.perform(get("/api/v1/pickup-locations").param("region", "VOLTA"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=300, private"))
                .andExpect(jsonPath("$.data[0].name").value("Ho Market"))
                .andExpect(jsonPath("$.data[0].address.town").value("Ho"));
    }

    @Test
    @WithMockUser(roles = "BUYER")
    void pickupLocations_InvalidRegion_ShouldReturn400() throws Exception {
        mockMvc.perform(get("/api/v1/pickup-locations").param("region", "Kumasi")).andExpect(status().isBadRequest());

        verifyNoInteractions(pickupLocationService);
    }

    @Test
    void pickupLocations_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/pickup-locations").param("region", "VOLTA")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCreatePickupLocation_InvalidRegion_ShouldReturn400() throws Exception {
        mockMvc.perform(post("/api/v1/admin/pickup-locations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Ho Market\",\"region\":\"Ho\",\"address\":{\"street\":\"Market Rd\",\"town\":\"Ho\"}}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("region")));

        verifyNoInteractions(pickupLocationService);
    }
}
