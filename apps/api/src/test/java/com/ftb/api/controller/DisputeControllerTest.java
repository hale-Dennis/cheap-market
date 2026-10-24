package com.ftb.api.controller;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import com.ftb.api.model.DisputeStatus;
import com.ftb.api.service.JwtService;
import com.ftb.api.service.DisputeService;
import com.ftb.api.config.SecurityConfig;
import org.springframework.http.MediaType;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.config.JwtAuthenticationFilter;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.config.CustomAccessDeniedHandler;
import com.ftb.api.dto.response.DisputeResponseDto;
import com.ftb.api.config.CustomAuthenticationEntryPoint;
import com.ftb.api.exception.InvalidRequestException;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


@WebMvcTest(controllers = DisputeController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class,
        CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "application.security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy0xMjM0NTY3ODkw",
        "application.security.jwt.expiration=3600000"
})
@WithMockUser(username = "jane@example.com", roles = "BUYER")
class DisputeControllerTest {

    private static final UUID ORDER = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DisputeService disputeService;

    @MockitoBean
    private UserRepository userRepository;

    private org.springframework.test.web.servlet.ResultActions report(String reason) throws Exception {
        String body = "{\"orderId\":\"" + ORDER + "\"" + (reason == null ? "" : ",\"reason\":\"" + reason + "\"") + "}";
        return mockMvc.perform(post("/api/v1/disputes").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    @Test
    void createDispute_ShouldReturn201() throws Exception {
        when(disputeService.createDispute(eq("jane@example.com"), any())).thenReturn(DisputeResponseDto.builder()
                .id(UUID.randomUUID()).orderId(ORDER).status(DisputeStatus.OPEN).reason("Rotten okro").build());

        report("Rotten okro")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.orderId").value(ORDER.toString()));
    }

    @Test
    void createDispute_BlankMissingOrTooLongReason_ShouldReturn400() throws Exception {
        report(null).andExpect(status().isBadRequest());
        report("   ").andExpect(status().isBadRequest());
        report("x".repeat(501)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("500 characters")));
        mockMvc.perform(post("/api/v1/disputes").contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Bad\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(disputeService);
    }

    @Test
    void createDispute_AlreadyDisputed_ShouldReturn409WithCode() throws Exception {
        when(disputeService.createDispute(any(), any()))
                .thenThrow(new ConflictException(DisputeService.ALREADY_DISPUTED, "You've already reported an issue with this order."));

        report("Again").andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("ALREADY_DISPUTED"));
    }

    @Test
    void createDispute_OrderNotCompleted_ShouldReturn422WithCode() throws Exception {
        when(disputeService.createDispute(any(), any()))
                .thenThrow(new InvalidRequestException(DisputeService.ORDER_NOT_COMPLETED, "Not yet."));

        report("Late").andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.code").value("ORDER_NOT_COMPLETED"));
    }

    @Test
    @WithMockUser(roles = "FARMER")
    void createDispute_AsFarmer_ShouldReturn403() throws Exception {
        report("Bad").andExpect(status().isForbidden());
        verifyNoInteractions(disputeService);
    }

    @Test
    @WithAnonymousUser
    void createDispute_SignedOut_ShouldReturn401() throws Exception {
        report("Bad").andExpect(status().isUnauthorized());
    }
}
