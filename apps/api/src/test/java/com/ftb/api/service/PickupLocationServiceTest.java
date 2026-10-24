package com.ftb.api.service;

import java.util.List;
import com.ftb.api.model.Address;
import org.junit.jupiter.api.Test;
import com.ftb.api.model.PickupLocation;
import com.ftb.api.mapper.PickupLocationMapperImpl;
import org.springframework.context.annotation.Import;
import com.ftb.api.dto.response.PickupLocationResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import static org.junit.jupiter.api.Assertions.assertEquals;


/** Region filtering and ordering of pickup locations, against real PostgreSQL (DB_URL). */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({PickupLocationService.class, PickupLocationMapperImpl.class})
class PickupLocationServiceTest {

    @Autowired
    private PickupLocationService pickupLocationService;

    @Autowired
    private TestEntityManager entityManager;

    private void location(String name, String region) {
        entityManager.persist(PickupLocation.builder()
                .name(name)
                .region(region)
                .address(new Address("Main St", "Town", null))
                .operatingHours("Daily 8am–6pm")
                .build());
    }

    @Test
    void returnsOnlyTheRegionsLocationsSortedByName() {
        // A region no other test uses, so data from other tests can't interfere.
        location("Zongo Junction", "SAVANNAH");
        location("Damongo Market", "SAVANNAH");
        location("Ho Market", "VOLTA");
        entityManager.flush();

        List<PickupLocationResponseDto> result = pickupLocationService.getLocationsByRegion("SAVANNAH");

        assertEquals(List.of("Damongo Market", "Zongo Junction"),
                result.stream().map(PickupLocationResponseDto::getName).toList());
        assertEquals("Town", result.get(0).getAddress().getTown());
    }

    @Test
    void returnsAnEmptyListForARegionWithoutLocations() {
        assertEquals(List.of(), pickupLocationService.getLocationsByRegion("WESTERN_NORTH"));
    }
}
