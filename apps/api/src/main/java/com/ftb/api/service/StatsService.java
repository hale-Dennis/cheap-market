package com.ftb.api.service;

import com.ftb.api.dto.response.AdminStatsResponse;
import com.ftb.api.dto.response.PublicStatsResponse;
import com.ftb.api.model.AccountStatus;
import com.ftb.api.model.DisputeStatus;
import com.ftb.api.model.OrderStatusGroup;
import com.ftb.api.model.UserRole;
import com.ftb.api.repository.DisputeRepository;
import com.ftb.api.repository.OrderRepository;
import com.ftb.api.repository.ProductRepository;
import com.ftb.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;


/** Counts for the admin dashboard and the public home page. */
@Service
@RequiredArgsConstructor
public class StatsService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final DisputeRepository disputeRepository;

    @Transactional(readOnly = true)
    public AdminStatsResponse getAdminStats() {
        return new AdminStatsResponse(
                userRepository.countByRole(UserRole.FARMER),
                productRepository.countLiveListings(),
                orderRepository.countByStatusIn(OrderStatusGroup.ACTIVE.getStatuses()),
                disputeRepository.countByStatusIn(Set.of(DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW)));
    }

    @Transactional(readOnly = true)
    public PublicStatsResponse getPublicStats() {
        return new PublicStatsResponse(
                userRepository.countByRoleAndAccountStatus(UserRole.FARMER, AccountStatus.ACTIVE),
                productRepository.countRegionsWithLiveListings());
    }
}
