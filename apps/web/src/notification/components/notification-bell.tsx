'use client'

import { BellIcon } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/shadcn/utils'
import { useInboxDesktopNotifications, useUnreadNotificationCount } from '@/notification/hooks/use-notifications'
import { NotificationInboxPanel } from './notification-inbox-panel'

interface NotificationBellViewProps {
  open: boolean
  unreadCount: number
  onOpenChange: (open: boolean) => void
  panel: React.ReactNode
}

const formatUnreadCount = (count: number) => {
  if (count > 99) {
    return '99+'
  }

  return String(count)
}

export const NotificationBellView: React.FC<NotificationBellViewProps> = ({
  open,
  unreadCount,
  onOpenChange,
  panel,
}) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative size-10 rounded-xl">
              <BellIcon className="size-5" />
              {unreadCount > 0 ? (
                <span
                  className={cn(
                    'bg-primary text-primary-foreground absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-5',
                  )}>
                  {formatUnreadCount(unreadCount)}
                </span>
              ) : null}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          Notifications
        </TooltipContent>
      </Tooltip>
      <PopoverContent side="right" align="end" sideOffset={14} collisionPadding={16} className="w-auto p-0">
        {panel}
      </PopoverContent>
    </Popover>
  )
}

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const { data } = useUnreadNotificationCount()
  const {
    desktopNotificationPermission,
    isRequestingDesktopNotificationPermission,
    requestDesktopNotificationPermission,
  } = useInboxDesktopNotifications()

  return (
    <NotificationBellView
      open={open}
      unreadCount={data?.unreadCount ?? 0}
      onOpenChange={setOpen}
      panel={
        <NotificationInboxPanel
          open={open}
          desktopNotificationPermission={desktopNotificationPermission}
          isRequestingDesktopNotificationPermission={isRequestingDesktopNotificationPermission}
          onEnableDesktopNotifications={() => {
            void requestDesktopNotificationPermission()
          }}
        />
      }
    />
  )
}
