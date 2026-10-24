package com.ftb.api.service.storage;

import java.nio.file.Path;
import java.nio.file.Files;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import static org.junit.jupiter.api.Assertions.*;


class ImageStorageTest {

    @TempDir
    Path uploadDir;

    @Test
    void local_Store_ShouldWriteFileAndReturnMediaUrl() throws Exception {
        LocalImageStorage storage = new LocalImageStorage(uploadDir);
        byte[] bytes = {1, 2, 3};

        String url = storage.store(bytes, "png", "farmers/abc");

        assertTrue(url.matches("^/api/v1/media/[0-9a-f-]{36}\\.png$"), url);
        String fileName = url.substring(LocalImageStorage.URL_PREFIX.length());
        assertArrayEquals(bytes, Files.readAllBytes(uploadDir.resolve(fileName)));
        assertTrue(storage.isManagedUrl(url));
        assertEquals(uploadDir.resolve(fileName).toAbsolutePath().normalize(), storage.find(fileName).orElseThrow());
    }

    @Test
    void local_IsManagedUrl_ShouldRejectForeignAndMalformedUrls() {
        LocalImageStorage storage = new LocalImageStorage(uploadDir);

        assertFalse(storage.isManagedUrl("https://evil.example/a.png"));
        assertFalse(storage.isManagedUrl("/api/v1/media/../secret.png"));
        assertFalse(storage.isManagedUrl("/api/v1/media/not-a-uuid.png"));
        assertFalse(storage.isManagedUrl(null));
    }

    @Test
    void local_Find_ShouldRejectPathTraversalAndMissingFiles() {
        LocalImageStorage storage = new LocalImageStorage(uploadDir);

        assertTrue(storage.find("../etc/passwd").isEmpty());
        assertTrue(storage.find("00000000-0000-0000-0000-000000000000.png").isEmpty());
    }

    @Test
    void cloudinary_IsManagedUrl_ShouldOnlyAcceptThisCloudsUploads() {
        CloudinaryImageStorage storage = new CloudinaryImageStorage("cloudinary://key:secret@demo-cloud");

        assertTrue(storage.isManagedUrl("https://res.cloudinary.com/demo-cloud/image/upload/v1/cheap-market/farmers/x/a.jpg"));
        assertFalse(storage.isManagedUrl("https://res.cloudinary.com/other-cloud/image/upload/v1/a.jpg"));
        assertFalse(storage.isManagedUrl("http://res.cloudinary.com/demo-cloud/image/upload/v1/a.jpg"));
        assertFalse(storage.isManagedUrl("/api/v1/media/00000000-0000-0000-0000-000000000000.png"));
    }
}
