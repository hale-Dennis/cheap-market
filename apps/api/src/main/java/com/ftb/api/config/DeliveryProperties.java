package com.ftb.api.config;

import java.util.Map;
import com.ftb.api.model.Region;
import org.springframework.boot.context.properties.ConfigurationProperties;


/**
 * Home-delivery fees (application.delivery.*): a flat default plus optional per-region overrides,
 * all in pesewas. Unknown region codes or negative fees fail start-up.
 */
@ConfigurationProperties("application.delivery")
public record DeliveryProperties(int defaultFeeCents, Map<String, Integer> feeCentsByRegion) {

    public DeliveryProperties {
        feeCentsByRegion = feeCentsByRegion == null ? Map.of() : Map.copyOf(feeCentsByRegion);
        if (defaultFeeCents < 0) {
            throw new IllegalStateException("application.delivery.default-fee-cents must not be negative");
        }
        feeCentsByRegion.forEach((region, fee) -> {
            if (!Region.isValid(region)) {
                throw new IllegalStateException("Unknown region in application.delivery.fee-cents-by-region: " + region);
            }
            if (fee == null || fee < 0) {
                throw new IllegalStateException("Delivery fee for " + region + " must not be negative");
            }
        });
    }
}
