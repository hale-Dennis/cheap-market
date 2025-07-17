package com.ftb.api.mapper;

import com.ftb.api.dto.response.PickupLocationResponseDto;
import com.ftb.api.model.PickupLocation;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PickupLocationMapper {

    PickupLocationResponseDto toPickupLocationResponseDto(PickupLocation location);
}