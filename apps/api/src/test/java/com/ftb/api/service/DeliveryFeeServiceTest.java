package com.ftb.api.service;

import java.util.Map;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import com.ftb.api.config.DeliveryProperties;
import com.ftb.api.exception.BadRequestException;
import static org.junit.jupiter.api.Assertions.*;


class DeliveryFeeServiceTest {

    private final DeliveryFeeService service =
            new DeliveryFeeService(new DeliveryProperties(1000, Map.of("GREATER_ACCRA", 1500, "OTI", 0)));

    @Test
    void usesTheRegionOverrideOrTheDefault() {
        assertEquals(1500, service.feeCentsFor("GREATER_ACCRA"));
        assertEquals(0, service.feeCentsFor("OTI"));
        assertEquals(1000, service.feeCentsFor("VOLTA"));
        assertEquals(new BigDecimal("15.00"), service.feeFor("GREATER_ACCRA"));
    }

    @Test
    void rejectsUnknownRegions() {
        assertThrows(BadRequestException.class, () -> service.feeCentsFor("Kumasi"));
        assertThrows(BadRequestException.class, () -> service.feeCentsFor(null));
    }

    @Test
    void invalidConfigurationFailsAtStartUp() {
        assertThrows(IllegalStateException.class, () -> new DeliveryProperties(-1, Map.of()));
        assertThrows(IllegalStateException.class, () -> new DeliveryProperties(1000, Map.of("ACCRA", 1500)));
        assertThrows(IllegalStateException.class, () -> new DeliveryProperties(1000, Map.of("VOLTA", -5)));
        assertEquals(Map.of(), new DeliveryProperties(1000, null).feeCentsByRegion());
    }
}
