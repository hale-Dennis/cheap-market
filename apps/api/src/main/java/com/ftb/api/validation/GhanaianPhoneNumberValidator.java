package com.ftb.api.validation;

import com.ftb.api.util.PhoneNumbers;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;


public class GhanaianPhoneNumberValidator implements ConstraintValidator<GhanaianPhoneNumber, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || value.isBlank() || PhoneNumbers.normalizeGhanaian(value).isPresent();
    }
}
