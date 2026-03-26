'use client'

import { formatDistanceToNow } from 'date-fns'
import { ArrowRightIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

import { Avatar, AvatarImage, GeometricAvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/shadcn/utils'
import {
  useInboxNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useUnreadNotificationCount,
} from '@/notification/hooks/use-notifications'
import { type DesktopNotificationPermissionState } from '@/notification/lib/desktop-notifications'
import { getNotificationHref } from '@/notification/lib/notification-navigation'
import { InboxNotificationListItem } from '@repo/shared'
import { renderNotificationItem } from './notification-inbox-renderers'

interface NotificationInboxPanelViewProps {
  items: InboxNotificationListItem[]
  unreadCount: number
  desktopNotificationPermission: DesktopNotificationPermissionState
  isRequestingDesktopNotificationPermission: boolean
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  isMarkAllPending: boolean
  pendingDeliveryIds?: string[]
  onEnableDesktopNotifications: () => void
  onSelect: (item: InboxNotificationListItem) => void
  onMarkRead: (deliveryId: string) => void
  onMarkAllRead: () => void
  loaderRef?: React.Ref<HTMLDivElement>
  scrollViewportRef?: React.Ref<HTMLDivElement>
}

const NotificationInboxItem: React.FC<{
  item: InboxNotificationListItem
  isMarkingRead: boolean
  onSelect: (item: InboxNotificationListItem) => void
  onMarkRead: (deliveryId: string) => void
}> = ({ item, isMarkingRead, onSelect, onMarkRead }) => {
  const actorName = item.payload.actor?.username ?? 'System'
  const actorImage = item.payload.actor?.imageUrl
  const itemHref = getNotificationHref(item)
  const isUnread = item.readAt === null

  return (
    <div
      className={cn(
        'rounded-2xl border p-3 transition-colors',
        isUnread ? 'bg-sidebar-accent/20 border-sidebar-border' : 'bg-background',
      )}>
      <div className="flex items-start gap-3">
        <Avatar className="size-10 border">
          {actorImage ? <AvatarImage src={actorImage} alt={actorName} /> : null}
          <GeometricAvatarFallback name={actorName} />
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
              {isUnread ? <span className="bg-primary size-2 shrink-0 rounded-full" aria-hidden="true" /> : null}
              <span className="truncate">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
            </div>
            {isUnread ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-2 text-xs"
                disabled={isMarkingRead}
                onClick={() => onMarkRead(item.deliveryId)}>
                Mark read
              </Button>
            ) : (
              <Badge variant="outline">Read</Badge>
            )}
          </div>
          <div className="space-y-3">
            <div>{renderNotificationItem(item)}</div>
            {itemHref ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3"
                onClick={() => onSelect(item)}>
                Open issue
                <ArrowRightIcon className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export const NotificationInboxPanelView: React.FC<NotificationInboxPanelViewProps> = ({
  items,
  unreadCount,
  desktopNotificationPermission,
  isRequestingDesktopNotificationPermission,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  isMarkAllPending,
  pendingDeliveryIds = [],
  onEnableDesktopNotifications,
  onSelect,
  onMarkRead,
  onMarkAllRead,
  loaderRef,
  scrollViewportRef,
}) => {
  const desktopNotificationsCallout =
    desktopNotificationPermission === 'granted' ? null : (
      <div className="px-4 pb-4">
        <div className="bg-muted/40 rounded-2xl border border-dashed px-4 py-3">
          <p className="text-sm font-medium">Desktop notifications</p>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            {desktopNotificationPermission === 'unsupported'
              ? 'This browser does not support desktop notifications.'
              : desktopNotificationPermission === 'denied'
                ? 'Desktop notifications are blocked for this site. Update your browser settings to enable them again.'
                : 'Get a native desktop alert when new inbox activity arrives while this tab is in the background.'}
          </p>
          {desktopNotificationPermission === 'default' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 rounded-full px-3"
              disabled={isRequestingDesktopNotificationPermission}
              onClick={onEnableDesktopNotifications}>
              {isRequestingDesktopNotificationPermission ? 'Enabling...' : 'Enable desktop alerts'}
            </Button>
          ) : null}
        </div>
      </div>
    )

  return (
    <div className="bg-popover text-popover-foreground flex h-[min(70vh,42rem)] w-[min(26rem,calc(100vw-5rem))] flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Inbox</h2>
          <p className="text-muted-foreground text-xs">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full px-3"
          disabled={unreadCount === 0 || isMarkAllPending}
          onClick={onMarkAllRead}>
          Mark all read
        </Button>
      </div>
      <Separator />
      {desktopNotificationsCallout}
      {desktopNotificationsCallout ? <Separator /> : null}
      <div ref={scrollViewportRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border p-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground flex h-full min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed text-center">
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="max-w-64 text-xs leading-5">
              Issue updates, deletions, and comment activity from your subscriptions will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <NotificationInboxItem
                key={item.deliveryId}
                item={item}
                isMarkingRead={pendingDeliveryIds.includes(item.deliveryId)}
                onSelect={onSelect}
                onMarkRead={onMarkRead}
              />
            ))}
            <div ref={loaderRef} className="text-muted-foreground py-2 text-center text-xs">
              {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Scroll to load more' : 'No more notifications'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const NotificationInboxPanel: React.FC<{
  open: boolean
  desktopNotificationPermission: DesktopNotificationPermissionState
  isRequestingDesktopNotificationPermission: boolean
  onEnableDesktopNotifications: () => void
}> = ({
  open,
  desktopNotificationPermission,
  isRequestingDesktopNotificationPermission,
  onEnableDesktopNotifications,
}) => {
  const router = useRouter()
  const { data: unreadCountData } = useUnreadNotificationCount()
  const { data, isLoading, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } = useInboxNotifications({
    enabled: open,
  })
  const {
    mutateAsync: markRead,
    isPending: isMarkReadPending,
    variables: pendingDeliveryId,
  } = useMarkNotificationRead()
  const { mutateAsync: markAllRead, isPending: isMarkAllPending } = useMarkAllNotificationsRead()

  const loaderRef = React.useRef<HTMLDivElement | null>(null)
  const scrollViewportRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const loader = loaderRef.current
    const scrollViewport = scrollViewportRef.current

    if (!open || !loader || !scrollViewport || !hasNextPage) {
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage()
        }
      },
      {
        root: scrollViewport,
        threshold: 0.25,
      },
    )

    observer.observe(loader)

    return () => {
      observer.disconnect()
    }
  }, [fetchNextPage, hasNextPage, open])

  const items = data?.pages.flatMap(page => page.items) ?? []

  const handleSelect = (item: InboxNotificationListItem) => {
    const href = getNotificationHref(item)
    if (!href) {
      return
    }

    if (item.readAt === null) {
      void markRead(item.deliveryId)
    }

    router.push(href)
  }

  return (
    <NotificationInboxPanelView
      items={items}
      unreadCount={unreadCountData?.unreadCount ?? 0}
      desktopNotificationPermission={desktopNotificationPermission}
      isRequestingDesktopNotificationPermission={isRequestingDesktopNotificationPermission}
      isLoading={isLoading || isPending}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={Boolean(hasNextPage)}
      isMarkAllPending={isMarkAllPending}
      pendingDeliveryIds={
        pendingDeliveryId ? [pendingDeliveryId] : isMarkReadPending ? items.map(item => item.deliveryId) : []
      }
      onEnableDesktopNotifications={onEnableDesktopNotifications}
      onSelect={handleSelect}
      onMarkRead={deliveryId => {
        void markRead(deliveryId)
      }}
      onMarkAllRead={() => {
        void markAllRead()
      }}
      loaderRef={loaderRef}
      scrollViewportRef={scrollViewportRef}
    />
  )
}
