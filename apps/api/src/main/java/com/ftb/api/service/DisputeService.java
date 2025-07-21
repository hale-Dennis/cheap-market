package com.ftb.api.service;

import com.ftb.api.dto.request.CreateDisputeRequest;
import com.ftb.api.dto.response.DisputeResponseDto;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.exception.InvalidRequestException;
import com.ftb.api.exception.ResourceNotFoundException;
import com.ftb.api.mapper.DisputeMapper;
import com.ftb.api.model.Dispute;
import com.ftb.api.model.Order;
import com.ftb.api.model.User;
import com.ftb.api.model.DisputeStatus;
import com.ftb.api.model.OrderStatus;
import com.ftb.api.repository.DisputeRepository;
import com.ftb.api.repository.OrderRepository;
import com.ftb.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
@Slf4j
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final DisputeMapper disputeMapper;

    @Transactional
    public DisputeResponseDto createDispute(String buyerEmail, CreateDisputeRequest request) {

        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + buyerEmail));
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        if (!order.getBuyer().getId().equals(buyer.getId())) {
            throw new InvalidRequestException("You can only dispute orders that you placed.");
        }
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new InvalidRequestException("You can only dispute orders that are completed.");
        }
        if (disputeRepository.existsByOrderId(order.getId())) {
            throw new ConflictException("A dispute for this order has already been submitted.");
        }

        order.setStatus(OrderStatus.DISPUTED);
        orderRepository.save(order);

        Dispute newDispute = new Dispute();
        newDispute.setOrder(order);
        newDispute.setReason(request.getReason());
        newDispute.setStatus(DisputeStatus.OPEN);
        disputeRepository.save(newDispute);

        log.info("New dispute submitted for order: {}. Admin notification required.", order.getId());

        return disputeMapper.toDisputeResponseDto(newDispute);
    }
}