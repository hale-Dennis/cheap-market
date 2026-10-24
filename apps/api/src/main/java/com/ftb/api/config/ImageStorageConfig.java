package com.ftb.api.config;

import java.nio.file.Path;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import com.ftb.api.service.storage.ImageStorage;
import com.ftb.api.service.storage.LocalImageStorage;
import com.ftb.api.service.storage.CloudinaryImageStorage;


@Configuration
@Slf4j
public class ImageStorageConfig {

    @Bean
    public ImageStorage imageStorage(
            @Value("${application.storage.cloudinary-url:}") String cloudinaryUrl,
            @Value("${application.storage.local-dir:uploads}") String localDir
    ) {
        if (cloudinaryUrl != null && !cloudinaryUrl.isBlank()) {
            log.info("Storing images in Cloudinary.");
            return new CloudinaryImageStorage(cloudinaryUrl);
        }
        log.warn("CLOUDINARY_URL is not set: storing images on local disk at '{}'. Do not use this in production.", localDir);
        return new LocalImageStorage(Path.of(localDir));
    }
}
