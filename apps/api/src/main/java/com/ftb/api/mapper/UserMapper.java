package com.ftb.api.mapper;

import org.mapstruct.Mapper;
import com.ftb.api.model.User;
import com.ftb.api.dto.request.RegisterRequest;
import com.ftb.api.dto.response.BuyerProfileResponse;


@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(RegisterRequest request);
    BuyerProfileResponse toBuyerProfileResponse(User user);

}