package com.ftb.api.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.ftb.api.model.Dispute;
import com.ftb.api.dto.response.DisputeResponseDto;


@Mapper(componentModel = "spring")
public interface DisputeMapper {

    @Mapping(source = "order.id", target = "orderId")
    DisputeResponseDto toDisputeResponseDto(Dispute dispute);
}