package com.ftb.api.validation;

import java.lang.annotation.Target;
import jakarta.validation.Payload;
import java.lang.annotation.Retention;
import jakarta.validation.Constraint;
import java.lang.annotation.Documented;
import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;


/** The value must be a Ghanaian phone number (0XXXXXXXXX or +233XXXXXXXXX). Null is allowed; pair with @NotBlank. */
@Documented
@Constraint(validatedBy = GhanaianPhoneNumberValidator.class)
@Target(FIELD)
@Retention(RUNTIME)
public @interface GhanaianPhoneNumber {
    String message() default "Phone number must be a valid Ghanaian number (e.g. 0241234567 or +233241234567)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
