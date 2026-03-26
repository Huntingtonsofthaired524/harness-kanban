import React from 'react'

import { cn } from '@/lib/shadcn/utils'
import { Activity } from '@repo/shared/issue/types'
import { ActivityActor } from './activity-actor'
import { ActivityTime } from './activity-time'

export interface ActivityItemLayoutProps {
  activity: Activity
  children: React.ReactNode
  className?: string
}

/**
 * Unified Activity Item layout component
 *
 * Automatically handles actor and time, only need to provide content
 *
 * @example
 * ```tsx
 * <ActivityItemLayout activity={activity}>
 *   <span>operation content</span>
 * </ActivityItemLayout>
 * ```
 */
export const ActivityItemLayout: React.FC<ActivityItemLayoutProps> = ({ activity, children, className }) => {
  return (
    <div
      className={cn(
        'text-muted-foreground flex w-full flex-wrap items-center text-xs leading-snug',
        'gap-1 overflow-hidden px-3',
        className,
      )}>
      <ActivityActor userId={activity.createdBy} />
      {children}
      <ActivityTime createdAt={Number(activity.createdAt)} />
    </div>
  )
}
