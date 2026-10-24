package com.ftb.api.controller;

import java.time.Duration;
import lombok.RequiredArgsConstructor;
import com.ftb.api.util.ResponseHandler;
import com.ftb.api.validation.ValidRegion;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import com.ftb.api.dto.response.ApiResponse;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import com.ftb.api.service.DeliveryFeeService;
import com.ftb.api.dto.response.DeliveryFeeResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


/** Public: lets checkout show the delivery fee before an order is placed. */
@RestController
@RequestMapping("/api/v1/delivery-fees")
@RequiredArgsConstructor
public class DeliveryFeeController {

    private final DeliveryFeeService deliveryFeeService;

    @GetMapping
    public ResponseEntity<ApiResponse<DeliveryFeeResponse>> getDeliveryFee(
            @RequestParam @NotBlank(message = "is required") @ValidRegion String region
    ) {
        DeliveryFeeResponse fee = new DeliveryFeeResponse(region, deliveryFeeService.feeCentsFor(region));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
                .body(ResponseHandler.successResponse("Delivery fee retrieved successfully.", HttpStatus.OK, fee).getBody());
    }
}
