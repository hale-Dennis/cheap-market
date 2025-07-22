package com.ftb.api.mapper;

import com.ftb.api.dto.response.AdminDisputeDetailDto;
import com.ftb.api.dto.response.AdminDisputeSummaryDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.ftb.api.model.Dispute;
import com.ftb.api.dto.response.DisputeResponseDto;


@Mapper(componentModel = "spring")
public interface DisputeMapper {

    @Mapping(source = "order.id", target = "orderId")
    DisputeResponseDto toDisputeResponseDto(Dispute dispute);

    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "order.buyer.fullName", target = "buyerName")
    AdminDisputeSummaryDto toAdminDisputeSummaryDto(Dispute dispute);

    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "order.buyer.fullName", target = "buyerName")
    @Mapping(source = "order.buyer.email", target = "buyerEmail")
    @Mapping(source = "order.buyer.phoneNumber", target = "buyerPhoneNumber")
    AdminDisputeDetailDto toAdminDisputeDetailDto(Dispute dispute);
}