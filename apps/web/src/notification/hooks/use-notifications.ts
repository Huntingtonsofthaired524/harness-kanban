'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

import { useApiServerClient } from '@/hooks/use-api-server'
import {
  getDesktopNotificationContent,
  getDesktopNotificationPermission,
  getNewUnreadInboxNotifications,
} from '@/notification/lib/desktop-notifications'
import { getNotificationHref } from '@/notification/lib/notification-navigation'
import { buildNotificationBatchQueryKeysToInvalidate } from '@/notification/lib/notification-query-invalidation'
import {
  DEFAULT_INBOX_NOTIFICATIONS_PAGE_SIZE,
  GetInboxNotificationsResponse,
  GetUnreadNotificationCountResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
} from '@repo/shared'
import { DEFAULT_WORKSPACE_ID } from '@repo/shared/constants'
import { InfiniteData, QueryKey, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DesktopNotificationPermissionState } from '@/notification/lib/desktop-notifications'

const UNREAD_COUNT_POLL_INTERVAL_MS = 15_000
const INBOX_POLL_INTERVAL_MS = 15_000
const DESKTOP_NOTIFICATIONS_PAGE_SIZE = 20

export const notificationQueryKeys = {
  all: ['api-server', 'notifications'] as const,
  inbox: () => [...notificationQueryKeys.all, 'inbox'] as const,
  inboxList: () => [...notificationQueryKeys.inbox(), 'list'] as const,
  inboxInfiniteList: (pageSize: number) => [...notificationQueryKeys.inboxList(), 'infinite', pageSize] as const,
  desktopLatest: (pageSize: number) => [...notificationQueryKeys.inbox(), 'desktop-latest', pageSize] as const,
  unreadCount: () => [...notificationQueryKeys.inbox(), 'unread-count'] as const,
}

const findUnreadNotification = (
  data: InfiniteData<GetInboxNotificationsResponse> | undefined,
  deliveryId: string,
): boolean => {
  if (!data) {
    return false
  }

  return data.pages.some(page => page.items.some(item => item.deliveryId === deliveryId && item.readAt === null))
}

const markNotificationReadInCache = (
  data: InfiniteData<GetInboxNotificationsResponse> | undefined,
  deliveryId: string,
  readAt: number | null,
): InfiniteData<GetInboxNotificationsResponse> | undefined => {
  if (!data) {
    return data
  }

  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      items: page.items.map(item =>
        item.deliveryId === deliveryId
          ? {
              ...item,
              readAt,
            }
          : item,
      ),
    })),
  }
}

const markAllNotificationsReadInCache = (
  data: InfiniteData<GetInboxNotificationsResponse> | undefined,
  readAt: number,
): InfiniteData<GetInboxNotificationsResponse> | undefined => {
  if (!data) {
    return data
  }

  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      items: page.items.map(item => ({
        ...item,
        readAt: item.readAt ?? readAt,
      })),
    })),
  }
}

const setUnreadCount = (
  current: GetUnreadNotificationCountResponse | undefined,
  updater: (count: number) => number,
): GetUnreadNotificationCountResponse | undefined => {
  if (!current) {
    return current
  }

  return {
    unreadCount: updater(current.unreadCount),
  }
}

const getInboxListQueryFilters = () =>
  ({
    queryKey: notificationQueryKeys.inboxList() satisfies QueryKey,
  }) as const

export const useUnreadNotificationCount = () => {
  const apiClient = useApiServerClient()

  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    enabled: !!apiClient,
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.get<GetUnreadNotificationCountResponse>(
        '/api/v1/notifications/inbox/unread-count',
      )

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    refetchInterval: UNREAD_COUNT_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    gcTime: 5 * 60 * 1000,
  })
}

export const useInboxNotifications = ({
  enabled,
  pageSize = DEFAULT_INBOX_NOTIFICATIONS_PAGE_SIZE,
}: {
  enabled: boolean
  pageSize?: number
}) => {
  const apiClient = useApiServerClient()

  return useInfiniteQuery({
    queryKey: notificationQueryKeys.inboxInfiniteList(pageSize),
    enabled: !!apiClient && enabled,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const searchParams = new URLSearchParams({
        limit: String(pageSize),
      })

      if (pageParam) {
        searchParams.set('cursor', pageParam)
      }

      const response = await apiClient.get<GetInboxNotificationsResponse>(
        `/api/v1/notifications/inbox?${searchParams.toString()}`,
      )

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    getNextPageParam: lastPage => lastPage.nextCursor || undefined,
    refetchInterval: enabled ? INBOX_POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    gcTime: 5 * 60 * 1000,
  })
}

export const useMarkNotificationRead = () => {
  const apiClient = useApiServerClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (deliveryId: string) => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.patch<MarkNotificationReadResponse>(
        `/api/v1/notifications/inbox/${deliveryId}/read`,
      )

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    onSuccess: result => {
      const inboxListQuery = getInboxListQueryFilters()
      const currentInboxPages =
        queryClient.getQueriesData<InfiniteData<GetInboxNotificationsResponse>>(inboxListQuery)[0]?.[1]
      const wasUnread = findUnreadNotification(currentInboxPages, result.deliveryId)

      queryClient.setQueriesData<InfiniteData<GetInboxNotificationsResponse>>(inboxListQuery, current =>
        markNotificationReadInCache(current, result.deliveryId, result.readAt),
      )

      if (wasUnread) {
        queryClient.setQueryData<GetUnreadNotificationCountResponse>(notificationQueryKeys.unreadCount(), current =>
          setUnreadCount(current, unreadCount => Math.max(0, unreadCount - 1)),
        )
      }
    },
  })
}

export const useMarkAllNotificationsRead = () => {
  const apiClient = useApiServerClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.patch<MarkAllNotificationsReadResponse>('/api/v1/notifications/inbox/read-all')

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    onSuccess: () => {
      const readAt = Date.now()

      queryClient.setQueriesData<InfiniteData<GetInboxNotificationsResponse>>(getInboxListQueryFilters(), current =>
        markAllNotificationsReadInCache(current, readAt),
      )
      queryClient.setQueryData<GetUnreadNotificationCountResponse>(notificationQueryKeys.unreadCount(), current =>
        setUnreadCount(current, () => 0),
      )
    },
  })
}

export const useInboxDesktopNotifications = () => {
  const apiClient = useApiServerClient()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { mutateAsync: markNotificationRead } = useMarkNotificationRead()

  const [permission, setPermission] = React.useState<DesktopNotificationPermissionState>('unsupported')
  const [isRequestingPermission, setIsRequestingPermission] = React.useState(false)
  const lastSeenDeliveryIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncPermission = () => {
      setPermission(getDesktopNotificationPermission())
    }

    syncPermission()
    window.addEventListener('focus', syncPermission)
    document.addEventListener('visibilitychange', syncPermission)

    return () => {
      window.removeEventListener('focus', syncPermission)
      document.removeEventListener('visibilitychange', syncPermission)
    }
  }, [])

  const requestPermission = React.useCallback(async () => {
    if (typeof window === 'undefined') {
      return 'unsupported' as const
    }

    const currentPermission = getDesktopNotificationPermission()
    if (currentPermission === 'unsupported' || currentPermission === 'granted') {
      setPermission(currentPermission)
      return currentPermission
    }

    setIsRequestingPermission(true)

    try {
      const nextPermission = await window.Notification.requestPermission()
      setPermission(nextPermission)
      return nextPermission
    } finally {
      setIsRequestingPermission(false)
    }
  }, [])

  const latestNotificationsQuery = useQuery({
    queryKey: notificationQueryKeys.desktopLatest(DESKTOP_NOTIFICATIONS_PAGE_SIZE),
    enabled: !!apiClient,
    queryFn: async () => {
      if (!apiClient) {
        throw new Error('API client not available')
      }

      const response = await apiClient.get<GetInboxNotificationsResponse>(
        `/api/v1/notifications/inbox?limit=${DESKTOP_NOTIFICATIONS_PAGE_SIZE}`,
      )

      if (!response.success) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    refetchInterval: INBOX_POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    staleTime: 10_000,
    gcTime: 5 * 60 * 1000,
  })

  React.useEffect(() => {
    const items = latestNotificationsQuery.data?.items ?? []
    const latestItem = items[0]

    if (!latestItem) {
      return
    }

    if (!lastSeenDeliveryIdRef.current) {
      lastSeenDeliveryIdRef.current = latestItem.deliveryId
      return
    }

    const newUnreadItems = getNewUnreadInboxNotifications(items, lastSeenDeliveryIdRef.current)
    lastSeenDeliveryIdRef.current = latestItem.deliveryId

    if (newUnreadItems.length === 0) {
      return
    }

    buildNotificationBatchQueryKeysToInvalidate(newUnreadItems, DEFAULT_WORKSPACE_ID).forEach(queryKey => {
      void queryClient.invalidateQueries({ queryKey })
    })

    if (permission !== 'granted') {
      return
    }

    const shouldShowDesktopNotifications =
      typeof document === 'undefined' || document.visibilityState === 'hidden' || !document.hasFocus()

    if (!shouldShowDesktopNotifications) {
      return
    }

    newUnreadItems.forEach(item => {
      const { title, body, icon } = getDesktopNotificationContent(item)
      const browserNotification = new window.Notification(title, {
        body,
        icon,
        tag: `harness-kanban-inbox-${item.deliveryId}`,
      })

      browserNotification.onclick = () => {
        browserNotification.close()
        window.focus()

        if (item.readAt === null) {
          void markNotificationRead(item.deliveryId)
        }

        const href = getNotificationHref(item)
        if (href) {
          router.push(href)
        }
      }
    })
  }, [latestNotificationsQuery.data, markNotificationRead, permission, queryClient, router])

  return {
    desktopNotificationPermission: permission,
    isRequestingDesktopNotificationPermission: isRequestingPermission,
    requestDesktopNotificationPermission: requestPermission,
  }
}
