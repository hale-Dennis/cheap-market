package com.ftb.api.dto.request;

import lombok.Data;
import jakarta.validation.constraints.Min;
import com.ftb.api.model.ProductStatus;


@Data
public class PartialUpdateProductRequest {

    private ProductStatus listingStatus;

    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity;
}