package com.ftb.api.service;

import java.math.BigDecimal;
import com.ftb.api.model.Region;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.ftb.api.config.DeliveryProperties;
import com.ftb.api.exception.BadRequestException;


/** The flat home-delivery fee for a region; the single source for checkout quotes and orders. */
@Service
@RequiredArgsConstructor
public class DeliveryFeeService {

    private final DeliveryProperties properties;

    public int feeCentsFor(String region) {
        if (!Region.isValid(region)) {
            throw new BadRequestException("Unknown region: " + region);
        }
        return properties.feeCentsByRegion().getOrDefault(region, properties.defaultFeeCents());
    }

    public BigDecimal feeFor(String region) {
        return BigDecimal.valueOf(feeCentsFor(region)).movePointLeft(2);
    }
}
