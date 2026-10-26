package com.ftb.api.controller;

import com.ftb.api.dto.response.ApiResponse;
import com.ftb.api.dto.response.PublicStatsResponse;
import com.ftb.api.service.StatsService;
import com.ftb.api.util.ResponseHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
public class StatsController {

    /** The numbers change slowly; let browsers and CDNs reuse them for 5 minutes. */
    static final CacheControl STATS_CACHE = CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic();

    private final StatsService statsService;

    /** Farmers selling and regions covered, for the home page. Public: no sign-in needed. */
    @GetMapping
    public ResponseEntity<ApiResponse<PublicStatsResponse>> getStats() {
        return ResponseEntity.ok()
                .cacheControl(STATS_CACHE)
                .body(ResponseHandler.successResponse("Stats retrieved successfully.", HttpStatus.OK, statsService.getPublicStats()).getBody());
    }
}
