package com.ftb.api.service;

import com.ftb.api.dto.request.CreateDisputeRequest;
import com.ftb.api.dto.request.UpdateDisputeRequestDto;
import com.ftb.api.dto.response.AdminDisputeDetailDto;
import com.ftb.api.dto.response.AdminDisputeSummaryDto;
import com.ftb.api.dto.response.DisputeResponseDto;
import com.ftb.api.dto.response.PaginatedResponse;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.exception.InvalidRequestException;
import com.ftb.api.exception.ResourceNotFoundException;
import com.ftb.api.mapper.DisputeMapper;
import com.ftb.api.model.Dispute;
import com.ftb.api.model.Order;
import com.ftb.api.model.DisputeStatus;
import com.ftb.api.model.OrderStatus;
import com.ftb.api.repository.DisputeRepository;
import com.ftb.api.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final OrderRepository orderRepository;
    private final DisputeMapper disputeMapper;
    private final AdminNotifier adminNotifier;

    public static final String ORDER_NOT_COMPLETED = "ORDER_NOT_COMPLETED";
    public static final String ALREADY_DISPUTED = "ALREADY_DISPUTED";
    /** How much of the buyer's description goes into the admin notification. */
    private static final int REASON_PREVIEW = 200;

    /**
     * Reports a problem with one of the buyer's completed orders: records the dispute, marks the order
     * DISPUTED and notifies admins, all in one transaction. Another buyer's order is reported as not found.
     */
    @Transactional
    public DisputeResponseDto createDispute(String buyerEmail, CreateDisputeRequest request) {
        // Lock the order: a simultaneous second report waits here, then finds the first and gets a 409.
        Order order = orderRepository.lockById(request.getOrderId())
                .filter(o -> o.getBuyer().getEmail().equals(buyerEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        if (disputeRepository.existsByOrderId(order.getId())) {
            throw alreadyDisputed();
        }
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new InvalidRequestException(ORDER_NOT_COMPLETED, "You can report an issue once the order is completed.");
        }

        order.setStatus(OrderStatus.DISPUTED);
        Dispute dispute = Dispute.builder()
                .order(order)
                .reason(request.getReason().strip())
                .status(DisputeStatus.OPEN)
                .build();
        try {
            disputeRepository.saveAndFlush(dispute);
        } catch (DataIntegrityViolationException e) {
            throw alreadyDisputed();
        }

        adminNotifier.notifyDisputeOpened(order.getId(), disputeMessage(order, dispute.getReason()));
        return disputeMapper.toDisputeResponseDto(dispute);
    }

    private static String disputeMessage(Order order, String reason) {
        String preview = reason.length() > REASON_PREVIEW ? reason.substring(0, REASON_PREVIEW - 1) + "…" : reason;
        return String.format("Issue reported on order %s by %s: \"%s\"",
                order.getOrderNumber(), order.getBuyer().getFullName(), preview);
    }

    private static ConflictException alreadyDisputed() {
        return new ConflictException(ALREADY_DISPUTED, "You've already reported an issue with this order.");
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<AdminDisputeSummaryDto> getAllDisputes(Pageable pageable) {
        Page<Dispute> disputePage = disputeRepository.findAll(pageable);

        List<AdminDisputeSummaryDto> disputeSummaries = disputePage.getContent().stream()
                .map(disputeMapper::toAdminDisputeSummaryDto)
                .collect(Collectors.toList());

        return PaginatedResponse.<AdminDisputeSummaryDto>builder()
                .content(disputeSummaries)
                .currentPage(disputePage.getNumber())
                .totalPages(disputePage.getTotalPages())
                .totalElements(disputePage.getTotalElements())
                .size(disputePage.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public AdminDisputeDetailDto getDisputeById(UUID disputeId) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found with id: " + disputeId));
        return disputeMapper.toAdminDisputeDetailDto(dispute);
    }

    @Transactional
    public AdminDisputeDetailDto updateDispute(UUID disputeId, UpdateDisputeRequestDto request) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found with id: " + disputeId));

        dispute.setStatus(request.getStatus());
        dispute.setResolutionNotes(request.getResolutionNotes());

        Dispute updatedDispute = disputeRepository.save(dispute);
        return disputeMapper.toAdminDisputeDetailDto(updatedDispute);
    }
}