package com.ftb.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;


@ResponseStatus(HttpStatus.CONFLICT)
public class ConflictException extends RuntimeException {

    /** Optional machine-readable code returned to the client, e.g. ALREADY_RATED. */
    private final String code;

    public ConflictException(String message) {
        this(null, message);
    }

    public ConflictException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}