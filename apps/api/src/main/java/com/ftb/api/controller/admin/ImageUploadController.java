package com.ftb.api.controller.admin;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import com.ftb.api.util.ResponseHandler;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import com.ftb.api.service.ImageUploadService;
import com.ftb.api.dto.response.ImageUploadResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/api/v1/admin/uploads")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ImageUploadController {

    private final ImageUploadService imageUploadService;

    /**
     * Uploads 1–5 JPEG/PNG images (≤ 2 MB each) for a farmer's produce listing.
     * The returned URLs are then sent as {@code imageUrls} when creating the listing.
     */
    @PostMapping(path = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadImages(
            @RequestParam UUID farmerId,
            @RequestParam("files") List<MultipartFile> files
    ) {
        List<String> urls = imageUploadService.uploadListingImages(farmerId, files);
        return ResponseHandler.successResponse("Images uploaded successfully.", HttpStatus.CREATED,
                new ImageUploadResponse(urls));
    }
}
