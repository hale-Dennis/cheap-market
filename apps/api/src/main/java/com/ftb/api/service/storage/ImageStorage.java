package com.ftb.api.service.storage;


/** Stores uploaded images and recognises the URLs it hands out. */
public interface ImageStorage {

    /**
     * Stores an image and returns the URL clients should use to load it.
     * @param bytes The image content (already validated as JPEG or PNG).
     * @param extension "jpg" or "png".
     * @param folder Logical folder, e.g. "farmers/{farmerId}".
     */
    String store(byte[] bytes, String extension, String folder);

    /** Whether {@code url} points at an image this storage handed out. */
    boolean isManagedUrl(String url);
}
