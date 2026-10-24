package com.ftb.api.validation;

import java.lang.annotation.Target;
import jakarta.validation.Payload;
import java.lang.annotation.Retention;
import jakarta.validation.Constraint;
import java.lang.annotation.Documented;
import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.RetentionPolicy.RUNTIME;


/** The value must be the name of a {@link com.ftb.api.model.Region}. Null is allowed; pair with @NotBlank. */
@Documented
@Constraint(validatedBy = RegionValidator.class)
@Target({FIELD, PARAMETER})
@Retention(RUNTIME)
public @interface ValidRegion {
    String message() default "Region must be one of Ghana's regions (e.g. GREATER_ACCRA)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
