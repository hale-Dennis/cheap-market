import type { AdminNotifications } from '@cheap-market/shared-types';

import { apiRequest } from '@/services/apiClient';

export function getAdminNotifications(): Promise<AdminNotifications> {
  return apiRequest<AdminNotifications>('/admin/notifications');
}

export function markNotificationRead(id: string): Promise<void> {
  return apiRequest<void>(`/admin/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
}

export function markAllNotificationsRead(): Promise<void> {
  return apiRequest<void>('/admin/notifications/read-all', { method: 'POST' });
}
