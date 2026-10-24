package com.ftb.api.service.storage;

import java.util.UUID;
import java.util.Optional;
import java.nio.file.Path;
import java.nio.file.Files;
import java.io.IOException;
import java.util.regex.Pattern;


/**
 * Stores images on the API's disk and serves them from {@code /api/v1/media/{file}}.
 * For local development and tests only: the disk is not durable on hosted platforms such as Render.
 */
public class LocalImageStorage implements ImageStorage {

    public static final String URL_PREFIX = "/api/v1/media/";
    private static final Pattern FILE_NAME = Pattern.compile("^[0-9a-f-]{36}\\.(jpg|png)$");

    private final Path directory;

    public LocalImageStorage(Path directory) {
        this.directory = directory.toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.directory);
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot create upload directory " + this.directory, ex);
        }
    }

    @Override
    public String store(byte[] bytes, String extension, String folder) {
        // Files are stored flat; the folder only matters for Cloudinary's organisation.
        String fileName = UUID.randomUUID() + "." + extension;
        try {
            Files.write(directory.resolve(fileName), bytes);
        } catch (IOException ex) {
            throw new ImageStorageException("Could not save the image. Please try again.", ex);
        }
        return URL_PREFIX + fileName;
    }

    @Override
    public boolean isManagedUrl(String url) {
        return url != null && url.startsWith(URL_PREFIX)
                && FILE_NAME.matcher(url.substring(URL_PREFIX.length())).matches();
    }

    /** Resolves a stored file by name, rejecting anything that isn't a file this storage created. */
    public Optional<Path> find(String fileName) {
        if (!FILE_NAME.matcher(fileName).matches()) {
            return Optional.empty();
        }
        Path file = directory.resolve(fileName);
        return Files.isRegularFile(file) ? Optional.of(file) : Optional.empty();
    }
}
