package com.ftb.api.controller;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import com.ftb.api.service.JwtService;
import com.ftb.api.service.RatingService;
import com.ftb.api.config.SecurityConfig;
import org.springframework.http.MediaType;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.config.JwtAuthenticationFilter;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.config.CustomAccessDeniedHandler;
import com.ftb.api.dto.response.RatingResponseDto;
import com.ftb.api.config.CustomAuthenticationEntryPoint;
import com.ftb.api.exception.InvalidRequestException;
import com.ftb.api.dto.response.FarmerRatingSummaryDto;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


@WebMvcTest(controllers = RatingController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "application.security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw",
        "application.security.jwt.expiration=3600000"
})
@WithMockUser(username = "jane@example.com", roles = "BUYER")
class RatingControllerTest {

    private static final UUID ORDER = UUID.randomUUID();
    private static final UUID FARMER = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RatingService ratingService;

    @MockitoBean
    private UserRepository userRepository;

    private static String body(Object score, String comment) {
        return "{\"orderId\":\"" + ORDER + "\",\"farmerId\":\"" + FARMER + "\",\"score\":" + score
                + (comment == null ? "" : ",\"comment\":\"" + comment + "\"") + "}";
    }

    private org.springframework.test.web.servlet.ResultActions rate(String body) throws Exception {
        return mockMvc.perform(post("/api/v1/ratings").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    @Test
    void createRating_ShouldReturn201() throws Exception {
        when(ratingService.createRating(eq("jane@example.com"), any())).thenReturn(RatingResponseDto.builder()
                .id(UUID.randomUUID()).orderId(ORDER).farmerId(FARMER).score(4).comment("Fresh").build());

        rate(body(4, "Fresh"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.score").value(4))
                .andExpect(jsonPath("$.data.farmerId").value(FARMER.toString()));
    }

    @Test
    void createRating_InvalidScoreCommentOrMissingFarmer_ShouldReturn400() throws Exception {
        rate(body(0, null)).andExpect(status().isBadRequest());
        rate(body(6, null)).andExpect(status().isBadRequest());
        rate(body(4, "x".repeat(301))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("300 characters")));
        rate("{\"orderId\":\"" + ORDER + "\",\"score\":4}").andExpect(status().isBadRequest());
        verifyNoInteractions(ratingService);
    }

    @Test
    void createRating_AlreadyRated_ShouldReturn409WithCode() throws Exception {
        when(ratingService.createRating(any(), any()))
                .thenThrow(new ConflictException(RatingService.ALREADY_RATED, "You've already rated this farmer for this order."));

        rate(body(5, null))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_RATED"));
    }

    @Test
    void createRating_OrderNotCompleted_ShouldReturn422WithCode() throws Exception {
        when(ratingService.createRating(any(), any()))
                .thenThrow(new InvalidRequestException(RatingService.ORDER_NOT_COMPLETED, "Not yet."));

        rate(body(5, null))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("ORDER_NOT_COMPLETED"));
    }

    @Test
    @WithMockUser(roles = "FARMER")
    void createRating_AsFarmer_ShouldReturn403() throws Exception {
        rate(body(5, null)).andExpect(status().isForbidden());
        verifyNoInteractions(ratingService);
    }

    @Test
    @WithAnonymousUser
    void createRating_SignedOut_ShouldReturn401() throws Exception {
        rate(body(5, null)).andExpect(status().isUnauthorized());
    }

    @Test
    @WithAnonymousUser
    void farmerRating_IsPublic() throws Exception {
        when(ratingService.getFarmerRating(FARMER)).thenReturn(
                FarmerRatingSummaryDto.builder().farmerId(FARMER).averageRating(4.5).ratingCount(2).build());

        mockMvc.perform(get("/api/v1/ratings").param("farmerId", FARMER.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.averageRating").value(4.5))
                .andExpect(jsonPath("$.data.ratingCount").value(2));
    }

    @Test
    @WithAnonymousUser
    void farmerRating_BadOrMissingId_ShouldReturn400() throws Exception {
        mockMvc.perform(get("/api/v1/ratings").param("farmerId", "nope")).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/ratings")).andExpect(status().isBadRequest());
    }
}
