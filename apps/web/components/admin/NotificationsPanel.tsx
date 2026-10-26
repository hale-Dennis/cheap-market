import useSWR from 'swr';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ApiError } from '@/services/apiClient';
import {
  getAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationService';

/** Checked every minute so new orders and disputes show up without reloading. */
const REFRESH_MS = 60_000;

function timeAgo(iso: string, now = Date.now()) {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** New-order and dispute notifications for admins, newest first. */
export function NotificationsPanel() {
  const { data, error, mutate } = useSWR('admin/notifications', getAdminNotifications, {
    refreshInterval: REFRESH_MS,
  });

  async function run(action: () => Promise<void>) {
    try {
      await action();
      await mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update notifications.');
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-3">
          Notifications
          {data && data.unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2.5 py-1 font-sans text-[13px] font-bold text-accent">
              {data.unreadCount} new
            </span>
          )}
        </CardTitle>
        {data && data.unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="bg-muted" onClick={() => run(markAllNotificationsRead)}>
            Mark all as read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error && !data && (
          <p role="alert" className="text-[15px] font-semibold text-destructive">
            Could not load notifications.
          </p>
        )}
        {!error && !data && <p className="text-[15px] text-muted-foreground">Loading…</p>}
        {data?.notifications.length === 0 && (
          <p className="text-[15px] text-muted-foreground">
            No notifications yet. New orders and reported issues will appear here.
          </p>
        )}
        {data && data.notifications.length > 0 && (
          <ul className="divide-y" aria-label="Recent notifications">
            {data.notifications.map((notification) => (
              <li key={notification.id} className="flex items-start gap-3.5 py-4">
                <span
                  aria-hidden="true"
                  className={cn('mt-2 h-2.5 w-2.5 shrink-0 rounded-full', notification.read ? 'bg-transparent' : 'bg-primary')}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className={cn('text-[15px] leading-relaxed', !notification.read && 'font-bold')}>
                    {!notification.read && <span className="sr-only">Unread: </span>}
                    {notification.type === 'DISPUTE_OPENED' && (
                      <span className="mr-2 rounded-full bg-status-disputed px-2.5 py-0.5 text-xs font-bold text-status-disputed-foreground">
                        Dispute<span className="sr-only">:</span>
                      </span>
                    )}
                    {notification.message}
                  </p>
                  <p className="text-[13px] text-muted-foreground">{timeAgo(notification.createdAt)}</p>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 underline-offset-4 hover:underline"
                    onClick={() => run(() => markNotificationRead(notification.id))}
                    aria-label={`Mark as read: ${notification.message}`}
                  >
                    Mark read
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
