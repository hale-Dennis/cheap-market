package com.ftb.api.controller.admin;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import com.ftb.api.util.ResponseHandler;
import com.ftb.api.service.AdminNotifier;
import org.springframework.http.HttpStatus;
import com.ftb.api.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.ftb.api.dto.response.AdminNotificationsResponse;
import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/api/v1/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final AdminNotifier adminNotifier;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminNotificationsResponse>> recent() {
        return ResponseHandler.successResponse("Notifications retrieved successfully.", HttpStatus.OK, adminNotifier.recent());
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<Void> markRead(@PathVariable UUID notificationId) {
        adminNotifier.markRead(notificationId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead() {
        adminNotifier.markAllRead();
        return ResponseEntity.noContent().build();
    }
}
