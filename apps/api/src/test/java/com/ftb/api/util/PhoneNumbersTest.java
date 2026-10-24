package com.ftb.api.util;

import java.util.Optional;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;


class PhoneNumbersTest {

    @ParameterizedTest
    @ValueSource(strings = {"0241234567", "024 123 4567", "024-123-4567", "+233241234567", "233241234567", "+233 (24) 123 4567"})
    void normalizeGhanaian_AcceptsCommonFormats(String input) {
        assertEquals(Optional.of("+233241234567"), PhoneNumbers.normalizeGhanaian(input));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "12345", "024123456", "02412345678", "+44241234567", "abcdefghij"})
    void normalizeGhanaian_RejectsInvalidNumbers(String input) {
        assertTrue(PhoneNumbers.normalizeGhanaian(input).isEmpty());
    }
}
