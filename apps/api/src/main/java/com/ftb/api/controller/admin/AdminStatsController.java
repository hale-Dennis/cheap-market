package com.ftb.api.controller.admin;

import com.ftb.api.dto.response.AdminStatsResponse;
import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.service.StatsService;
import com.ftb.api.util.ResponseHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminStatsController {

    private final StatsService statsService;

    /** Farmers, live listings, orders in progress and open disputes, for the dashboard. */
    @GetMapping
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {
        return ResponseHandler.successResponse("Stats retrieved successfully.", HttpStatus.OK, statsService.getAdminStats());
    }
}
