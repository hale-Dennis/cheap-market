package com.ftb.api.service;

import java.util.UUID;
import java.util.Optional;
import com.ftb.api.model.*;
import org.mockito.Spy;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import com.ftb.api.mapper.DisputeMapper;
import com.ftb.api.mapper.DisputeMapperImpl;
import com.ftb.api.repository.OrderRepository;
import com.ftb.api.repository.DisputeRepository;
import com.ftb.api.exception.ConflictException;
import com.ftb.api.dto.response.DisputeResponseDto;
import com.ftb.api.dto.request.CreateDisputeRequest;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import com.ftb.api.exception.InvalidRequestException;
import com.ftb.api.exception.ResourceNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;


@ExtendWith(MockitoExtension.class)
class DisputeServiceTest {

    @Mock
    private DisputeRepository disputeRepository;
    @Mock
    private OrderRepository orderRepository;
    @Spy
    private DisputeMapper disputeMapper = new DisputeMapperImpl();
    @Mock
    private AdminNotifier adminNotifier;

    @InjectMocks
    private DisputeService disputeService;

    private static final String EMAIL = "jane@example.com";
    private Order order;

    @BeforeEach
    void setUp() {
        User buyer = User.builder().id(UUID.randomUUID()).email(EMAIL).fullName("Jane Doe").role(UserRole.BUYER).build();
        order = Order.builder().id(UUID.randomUUID()).orderNumber("CM-7K3F9Q2X").buyer(buyer).status(OrderStatus.COMPLETED).build();
    }

    private CreateDisputeRequest request(String reason) {
        CreateDisputeRequest request = new CreateDisputeRequest();
        request.setOrderId(order.getId());
        request.setReason(reason);
        return request;
    }

    private void orderFound() {
        when(orderRepository.lockById(order.getId())).thenReturn(Optional.of(order));
    }

    @Test
    void createDispute_RecordsItMarksTheOrderDisputedAndNotifiesAdmins() {
        orderFound();

        DisputeResponseDto result = disputeService.createDispute(EMAIL, request("  Half the tomatoes were rotten.  "));

        assertEquals(OrderStatus.DISPUTED, order.getStatus());
        assertEquals(DisputeStatus.OPEN, result.getStatus());
        assertEquals("Half the tomatoes were rotten.", result.getReason());
        assertEquals(order.getId(), result.getOrderId());
        verify(disputeRepository).saveAndFlush(any(Dispute.class));
        verify(adminNotifier).notifyDisputeOpened(order.getId(),
                "Issue reported on order CM-7K3F9Q2X by Jane Doe: \"Half the tomatoes were rotten.\"");
    }

    @Test
    void createDispute_LongReasonIsShortenedInTheNotification() {
        orderFound();

        disputeService.createDispute(EMAIL, request("x".repeat(500)));

        ArgumentCaptor<String> message = ArgumentCaptor.forClass(String.class);
        verify(adminNotifier).notifyDisputeOpened(eq(order.getId()), message.capture());
        assertTrue(message.getValue().endsWith("x…\""));
        assertTrue(message.getValue().length() < 500, "fits the notifications.message column");
    }

    @Test
    void createDispute_SomeoneElsesOrder_IsNotFound() {
        order.getBuyer().setEmail("other@example.com");
        orderFound();

        assertThrows(ResourceNotFoundException.class, () -> disputeService.createDispute(EMAIL, request("Bad")));
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
        verifyNoInteractions(adminNotifier);
    }

    @Test
    void createDispute_OrderNotCompleted_Returns422Code() {
        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        orderFound();

        InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                () -> disputeService.createDispute(EMAIL, request("Late")));
        assertEquals(DisputeService.ORDER_NOT_COMPLETED, ex.getCode());
        assertEquals(OrderStatus.OUT_FOR_DELIVERY, order.getStatus());
    }

    @Test
    void createDispute_AlreadyDisputed_Returns409Code() {
        order.setStatus(OrderStatus.DISPUTED);
        orderFound();
        when(disputeRepository.existsByOrderId(order.getId())).thenReturn(true);

        ConflictException ex = assertThrows(ConflictException.class,
                () -> disputeService.createDispute(EMAIL, request("Again")));
        assertEquals(DisputeService.ALREADY_DISPUTED, ex.getCode());
        verify(disputeRepository, never()).saveAndFlush(any());
        verifyNoInteractions(adminNotifier);
    }

    @Test
    void createDispute_SimultaneousDuplicateHitsTheUniqueConstraint_Returns409Code() {
        orderFound();
        when(disputeRepository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("order_id"));

        ConflictException ex = assertThrows(ConflictException.class,
                () -> disputeService.createDispute(EMAIL, request("Bad")));
        assertEquals(DisputeService.ALREADY_DISPUTED, ex.getCode());
        verify(adminNotifier, never()).notifyDisputeOpened(any(), anyString());
    }

    @Test
    void createDispute_UnknownOrder_IsNotFound() {
        when(orderRepository.lockById(order.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> disputeService.createDispute(EMAIL, request("Bad")));
    }
}
