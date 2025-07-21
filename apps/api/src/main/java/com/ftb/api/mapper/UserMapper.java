package com.ftb.api.mapper;

import org.mapstruct.Mapper;
import com.ftb.api.model.User;
import org.mapstruct.BeanMapping;
import org.mapstruct.MappingTarget;
import com.ftb.api.dto.request.RegisterRequest;
import com.ftb.api.dto.response.BuyerProfileResponse;
import org.mapstruct.NullValuePropertyMappingStrategy;
import com.ftb.api.dto.request.UpdateBuyerProfileRequest;


@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(RegisterRequest request);
    BuyerProfileResponse toBuyerProfileResponse(User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUserFromDto(UpdateBuyerProfileRequest dto, @MappingTarget User user);

}