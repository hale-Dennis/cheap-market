package com.ftb.api.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.ftb.api.model.Rating;
import com.ftb.api.dto.response.RatingResponseDto;


@Mapper(componentModel = "spring")
public interface RatingMapper {

    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "farmer.id", target = "farmerId")
    RatingResponseDto toRatingResponseDto(Rating rating);
}