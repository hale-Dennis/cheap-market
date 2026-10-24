package com.ftb.api.controller;

import java.nio.file.Path;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.FileSystemResource;
import com.ftb.api.service.storage.ImageStorage;
import com.ftb.api.service.storage.LocalImageStorage;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


/** Serves images stored by {@link LocalImageStorage}. Returns 404 when images live in Cloudinary. */
@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final ImageStorage imageStorage;

    @GetMapping("/{fileName}")
    public ResponseEntity<FileSystemResource> getImage(@PathVariable String fileName) {
        if (!(imageStorage instanceof LocalImageStorage localStorage)) {
            return ResponseEntity.notFound().build();
        }
        return localStorage.find(fileName)
                .map(file -> ResponseEntity.ok()
                        .contentType(mediaTypeFor(file))
                        // File names are random and never reused, so the content never changes.
                        .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                        .body(new FileSystemResource(file)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private static MediaType mediaTypeFor(Path file) {
        return file.toString().endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
    }
}
