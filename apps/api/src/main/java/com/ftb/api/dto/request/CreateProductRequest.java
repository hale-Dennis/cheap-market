package com.ftb.api.dto.request;

import lombok.Data;
import lombok.Builder;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.*;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotNull(message = "Farmer ID cannot be null")
    private UUID farmerId;

    @NotNull(message = "Category ID cannot be null")
    private UUID categoryId;

    @NotBlank(message = "Product name cannot be blank")
    private String name;

    private String description;

    @NotNull(message = "Price cannot be null")
    @Positive(message = "Price must be a positive number")
    private Integer priceCents;

    @NotBlank(message = "Unit of measure cannot be blank")
    private String unit;

    @NotNull(message = "Harvest date cannot be null")
    @FutureOrPresent(message = "Harvest date cannot be in the past")
    private LocalDate harvestDate;

    @NotNull
    @Size(min = 1, max = 5, message = "You must provide between 1 and 5 image URLs")
    private List<String> imageUrls;
}