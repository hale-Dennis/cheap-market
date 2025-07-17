package com.ftb.api.mapper;

import com.ftb.api.dto.response.DisputeResponseDto;
import com.ftb.api.model.Dispute;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DisputeMapper {

    @Mapping(source = "order.id", target = "orderId")
    DisputeResponseDto toDisputeResponseDto(Dispute dispute);
}