package com.ftb.api.mapper;

import com.ftb.api.dto.request.RegisterRequest;
import com.ftb.api.dto.request.UpdateBuyerProfileRequest;
import com.ftb.api.dto.response.BuyerProfileResponse;
import com.ftb.api.model.User;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(RegisterRequest request);
    BuyerProfileResponse toBuyerProfileResponse(User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUserFromDto(UpdateBuyerProfileRequest dto, @MappingTarget User user);

}