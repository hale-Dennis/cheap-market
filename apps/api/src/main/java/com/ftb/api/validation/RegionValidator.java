package com.ftb.api.validation;

import com.ftb.api.model.Region;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;


public class RegionValidator implements ConstraintValidator<ValidRegion, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || value.isBlank() || Region.isValid(value);
    }
}
