package com.ftb.api.service;

import java.util.List;
import java.util.UUID;
import java.util.Arrays;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import com.ftb.api.model.UserRole;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.repository.UserRepository;
import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.*;
import com.ftb.api.exception.BadRequestException;
import com.ftb.api.service.storage.ImageStorage;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import com.ftb.api.exception.ResourceNotFoundException;
import org.springframework.web.multipart.MultipartFile;


@ExtendWith(MockitoExtension.class)
class ImageUploadServiceTest {

    static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10, 'J', 'F', 'I', 'F'};
    static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n', 0, 0, 0, 0x0D};

    @Mock
    private ImageStorage imageStorage;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ImageUploadService imageUploadService;

    private final UUID farmerId = UUID.randomUUID();

    static MockMultipartFile file(String name, String contentType, byte[] bytes) {
        return new MockMultipartFile("files", name, contentType, bytes);
    }

    @BeforeEach
    void farmerExists() {
        lenient().when(userRepository.existsByIdAndRole(farmerId, UserRole.FARMER)).thenReturn(true);
    }

    @Test
    void upload_ValidJpegAndPng_ShouldStoreInFarmerFolderAndReturnUrlsInOrder() {
        when(imageStorage.store(JPEG, "jpg", "farmers/" + farmerId)).thenReturn("/api/v1/media/a.jpg");
        when(imageStorage.store(PNG, "png", "farmers/" + farmerId)).thenReturn("/api/v1/media/b.png");

        List<String> urls = imageUploadService.uploadListingImages(farmerId,
                List.of(file("a.jpg", "image/jpeg", JPEG), file("b.png", "image/png", PNG)));

        assertEquals(List.of("/api/v1/media/a.jpg", "/api/v1/media/b.png"), urls);
    }

    @Test
    void upload_ForUnknownOrNonFarmer_ShouldThrowNotFound() {
        UUID buyerId = UUID.randomUUID();
        when(userRepository.existsByIdAndRole(buyerId, UserRole.FARMER)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
                () -> imageUploadService.uploadListingImages(buyerId, List.of(file("a.jpg", "image/jpeg", JPEG))));
        verifyNoInteractions(imageStorage);
    }

    @Test
    void upload_NoFiles_ShouldThrowBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> imageUploadService.uploadListingImages(farmerId, List.of()));
        assertEquals("Select at least one image.", ex.getMessage());
    }

    @Test
    void upload_MoreThanFiveFiles_ShouldThrowBadRequest() {
        List<MultipartFile> six = java.util.stream.IntStream.range(0, 6)
                .<MultipartFile>mapToObj(i -> file(i + ".jpg", "image/jpeg", JPEG)).toList();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> imageUploadService.uploadListingImages(farmerId, six));
        assertEquals("A listing can have at most 5 images.", ex.getMessage());
        verifyNoInteractions(imageStorage);
    }

    @Test
    void upload_FileOver2Mb_ShouldThrowBadRequest() {
        byte[] big = Arrays.copyOf(JPEG, (int) ImageUploadService.MAX_BYTES + 1);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> imageUploadService.uploadListingImages(farmerId, List.of(file("big.jpg", "image/jpeg", big))));
        assertEquals("\"big.jpg\" is larger than 2 MB.", ex.getMessage());
    }

    @Test
    void upload_FileExactly2Mb_ShouldBeAccepted() {
        byte[] max = Arrays.copyOf(JPEG, (int) ImageUploadService.MAX_BYTES);
        when(imageStorage.store(any(), any(), any())).thenReturn("/api/v1/media/a.jpg");

        assertEquals(1, imageUploadService.uploadListingImages(farmerId, List.of(file("max.jpg", "image/jpeg", max))).size());
    }

    @Test
    void upload_NonImageClaimingToBeJpeg_ShouldThrowBadRequest() {
        MockMultipartFile fake = file("evil.jpg", "image/jpeg", "<html>not an image</html>".getBytes());

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> imageUploadService.uploadListingImages(farmerId, List.of(fake)));
        assertEquals("\"evil.jpg\" must be a JPEG or PNG image.", ex.getMessage());
    }

    @Test
    void upload_GifImage_ShouldThrowBadRequest() {
        MockMultipartFile gif = file("a.gif", "image/gif", "GIF89a....".getBytes());

        assertThrows(BadRequestException.class,
                () -> imageUploadService.uploadListingImages(farmerId, List.of(gif)));
    }

    @Test
    void upload_OneInvalidFile_ShouldStoreNothing() {
        List<MultipartFile> files = List.of(file("ok.jpg", "image/jpeg", JPEG), file("bad.txt", "text/plain", "hi".getBytes()));

        assertThrows(BadRequestException.class, () -> imageUploadService.uploadListingImages(farmerId, files));
        verifyNoInteractions(imageStorage);
    }
}
