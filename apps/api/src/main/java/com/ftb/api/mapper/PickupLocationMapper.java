package com.ftb.api.mapper;

import org.mapstruct.Mapper;
import com.ftb.api.model.PickupLocation;
import com.ftb.api.dto.response.PickupLocationResponseDto;


@Mapper(componentModel = "spring")
public interface PickupLocationMapper {

    PickupLocationResponseDto toPickupLocationResponseDto(PickupLocation location);
}