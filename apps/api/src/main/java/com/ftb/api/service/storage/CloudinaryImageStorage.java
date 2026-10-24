package com.ftb.api.service.storage;

import java.util.Map;
import java.io.IOException;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;


/** Stores images in Cloudinary under {@code cheap-market/<folder>}. */
public class CloudinaryImageStorage implements ImageStorage {

    private static final String ROOT_FOLDER = "cheap-market";

    private final Cloudinary cloudinary;
    private final String urlPrefix;

    public CloudinaryImageStorage(String cloudinaryUrl) {
        this.cloudinary = new Cloudinary(cloudinaryUrl);
        this.cloudinary.config.secure = true;
        this.urlPrefix = "https://res.cloudinary.com/" + cloudinary.config.cloudName + "/image/upload/";
    }

    @Override
    public String store(byte[] bytes, String extension, String folder) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(bytes, ObjectUtils.asMap(
                    "folder", ROOT_FOLDER + "/" + folder,
                    "resource_type", "image"));
            return (String) result.get("secure_url");
        } catch (IOException ex) {
            throw new ImageStorageException("Could not upload the image. Please try again.", ex);
        }
    }

    @Override
    public boolean isManagedUrl(String url) {
        return url != null && url.startsWith(urlPrefix);
    }
}
