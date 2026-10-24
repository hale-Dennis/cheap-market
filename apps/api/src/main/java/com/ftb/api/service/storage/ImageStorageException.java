package com.ftb.api.service.storage;


/** The storage backend failed to save an image (not the client's fault). */
public class ImageStorageException extends RuntimeException {
    public ImageStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
