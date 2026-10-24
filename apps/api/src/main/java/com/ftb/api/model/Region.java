package com.ftb.api.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;


/**
 * The administrative regions of Ghana. Users and pickup locations store the enum name (e.g. "GREATER_ACCRA").
 * Keep in sync with packages/shared-types/src/regions.ts (a frontend test enforces this).
 */
@Getter
@RequiredArgsConstructor
public enum Region {
    AHAFO("Ahafo"),
    ASHANTI("Ashanti"),
    BONO("Bono"),
    BONO_EAST("Bono East"),
    CENTRAL("Central"),
    EASTERN("Eastern"),
    GREATER_ACCRA("Greater Accra"),
    NORTH_EAST("North East"),
    NORTHERN("Northern"),
    OTI("Oti"),
    SAVANNAH("Savannah"),
    UPPER_EAST("Upper East"),
    UPPER_WEST("Upper West"),
    VOLTA("Volta"),
    WESTERN("Western"),
    WESTERN_NORTH("Western North");

    private final String displayName;

    public static boolean isValid(String code) {
        if (code == null) {
            return false;
        }
        for (Region region : values()) {
            if (region.name().equals(code)) {
                return true;
            }
        }
        return false;
    }
}
