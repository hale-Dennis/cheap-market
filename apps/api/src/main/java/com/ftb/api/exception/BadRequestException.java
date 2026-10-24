package com.ftb.api.exception;


/** The request is invalid in a way bean validation cannot express (returns 400). */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
