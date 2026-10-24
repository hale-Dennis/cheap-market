package com.ftb.api.exception;


/** The request is invalid in a way bean validation cannot express (returns 400). */
public class BadRequestException extends RuntimeException {

    /** Optional machine-readable code returned to the client, e.g. EMPTY_CART. */
    private final String code;

    public BadRequestException(String message) {
        this(null, message);
    }

    public BadRequestException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
