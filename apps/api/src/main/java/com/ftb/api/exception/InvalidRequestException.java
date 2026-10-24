package com.ftb.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;


@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class InvalidRequestException extends RuntimeException {

    /** Optional machine-readable code returned to the client, e.g. INACTIVE_PRODUCT. */
    private final String code;

    public InvalidRequestException(String message) {
        this(null, message);
    }

    public InvalidRequestException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}