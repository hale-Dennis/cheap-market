package com.ftb.api.util;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


/**
 * Normalises Ghanaian phone numbers to E.164 (+233XXXXXXXXX) so the same number
 * entered as "024 123 4567" or "+233241234567" is stored, and de-duplicated, identically.
 */
public final class PhoneNumbers {

    private static final Pattern SEPARATORS = Pattern.compile("[\\s\\-()]");
    private static final Pattern INTERNATIONAL = Pattern.compile("^\\+?233(\\d{9})$");
    private static final Pattern LOCAL = Pattern.compile("^0(\\d{9})$");

    private PhoneNumbers() {
    }

    public static Optional<String> normalizeGhanaian(String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        String digits = SEPARATORS.matcher(raw.trim()).replaceAll("");
        for (Pattern pattern : new Pattern[]{INTERNATIONAL, LOCAL}) {
            Matcher matcher = pattern.matcher(digits);
            if (matcher.matches()) {
                return Optional.of("+233" + matcher.group(1));
            }
        }
        return Optional.empty();
    }
}
