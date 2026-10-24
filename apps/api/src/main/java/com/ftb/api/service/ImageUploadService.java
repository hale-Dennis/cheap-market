package com.ftb.api.service;

import java.util.List;
import java.util.UUID;
import java.util.ArrayList;
import java.io.IOException;
import com.ftb.api.model.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.ftb.api.repository.UserRepository;
import com.ftb.api.exception.BadRequestException;
import com.ftb.api.service.storage.ImageStorage;
import org.springframework.web.multipart.MultipartFile;
import com.ftb.api.exception.ResourceNotFoundException;


/** Validates and stores produce listing images. */
@Service
@RequiredArgsConstructor
public class ImageUploadService {

    public static final int MAX_IMAGES = 5;
    public static final long MAX_BYTES = 2L * 1024 * 1024;

    private static final byte[] JPEG_SIGNATURE = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};

    private final ImageStorage imageStorage;
    private final UserRepository userRepository;

    /**
     * Validates every image first (1–5 files, JPEG or PNG by content, ≤ 2 MB each), then stores them
     * in the farmer's folder.
     * @return The URLs of the stored images, in upload order.
     */
    public List<String> uploadListingImages(UUID farmerId, List<MultipartFile> files) {
        if (!userRepository.existsByIdAndRole(farmerId, UserRole.FARMER)) {
            throw new ResourceNotFoundException("Farmer not found with id: " + farmerId);
        }
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("Select at least one image.");
        }
        if (files.size() > MAX_IMAGES) {
            throw new BadRequestException("A listing can have at most " + MAX_IMAGES + " images.");
        }

        List<ValidatedImage> images = new ArrayList<>();
        for (MultipartFile file : files) {
            images.add(validate(file));
        }

        String folder = "farmers/" + farmerId;
        return images.stream()
                .map(image -> imageStorage.store(image.bytes(), image.extension(), folder))
                .toList();
    }

    private ValidatedImage validate(MultipartFile file) {
        String name = file.getOriginalFilename() == null ? "Image" : "\"" + file.getOriginalFilename() + "\"";
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException(name + " is larger than 2 MB.");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            throw new BadRequestException(name + " could not be read.");
        }
        // Check the actual content, not the client-supplied Content-Type, which is easy to fake.
        if (startsWith(bytes, JPEG_SIGNATURE)) {
            return new ValidatedImage(bytes, "jpg");
        }
        if (startsWith(bytes, PNG_SIGNATURE)) {
            return new ValidatedImage(bytes, "png");
        }
        throw new BadRequestException(name + " must be a JPEG or PNG image.");
    }

    private static boolean startsWith(byte[] bytes, byte[] signature) {
        if (bytes.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if (bytes[i] != signature[i]) {
                return false;
            }
        }
        return true;
    }

    private record ValidatedImage(byte[] bytes, String extension) {
    }
}
