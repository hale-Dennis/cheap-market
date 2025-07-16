package com.ftb.api.mapper;

import org.mapstruct.Mapper;
import com.ftb.api.model.User;
import com.ftb.api.dto.response.FarmerResponse;
import com.ftb.api.dto.request.CreateFarmerRequest;


@Mapper(componentModel = "spring")
public interface FarmerMapper {
    User toUser(CreateFarmerRequest request);
    FarmerResponse toFarmerResponse(User user);
}
