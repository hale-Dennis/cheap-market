package com.ftb.api.dto.request;

import lombok.Data;
import java.util.UUID;
import java.util.List;
import java.time.LocalDate;
import jakarta.validation.constraints.*;


@Data
public class UpdateProductRequest {
    @NotNull(message = "Category ID cannot be null")
    private UUID categoryId;

    @NotBlank(message = "Product name cannot be blank")
    @Size(max = 100, message = "Product name must be at most 100 characters")
    private String name;

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    /** Price in pesewas (GH₵ 1 = 100), to avoid floating-point rounding. */
    @NotNull(message = "Price cannot be null")
    @Positive(message = "Price must be greater than zero")
    @Max(value = 100_000_000, message = "Price must be at most GH₵ 1,000,000")
    private Integer priceCents;

    @NotBlank(message = "Unit of measure cannot be blank")
    @Size(max = 30, message = "Unit of measure must be at most 30 characters")
    private String unit;

    /** When the produce was harvested; it is the freshness indicator, so it cannot be in the future. */
    @NotNull(message = "Harvest date cannot be null")
    @PastOrPresent(message = "Harvest date cannot be in the future")
    private LocalDate harvestDate;

    @NotNull(message = "At least one image is required")
    @Size(min = 1, max = 5, message = "A listing must have between 1 and 5 images")
    private List<@NotBlank(message = "Image URL cannot be blank") String> imageUrls;
}