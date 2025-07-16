package com.ftb.api.dto.response;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import java.time.Instant;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.ftb.api.model.AccountStatus;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String region;
    private AccountStatus accountStatus;
    private Instant createdAt;
}
