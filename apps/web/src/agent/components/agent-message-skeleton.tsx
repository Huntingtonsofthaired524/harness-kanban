'use client'

import { cn } from '@/lib/shadcn/utils'

interface AgentMessageSkeletonProps {
  /** Number of skeleton messages to render */
  count?: number
  className?: string
}

/**
 * Shimmer skeleton with a sliding highlight effect
 */
function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-accent relative overflow-hidden rounded-2xl', className)}>
      <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  )
}

/**
 * Skeleton placeholder for a single user message bubble
 */
function UserMessageSkeleton() {
  return (
    <div className="flex justify-end">
      <ShimmerSkeleton className="h-10 w-32" />
    </div>
  )
}

/**
 * Skeleton placeholder for a single assistant message bubble
 */
function AssistantMessageSkeleton() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] space-y-2">
        <ShimmerSkeleton className="h-10 w-48" />
      </div>
    </div>
  )
}

/**
 * Skeleton loading component for message list.
 * Mimics the layout of actual messages for a smoother loading experience.
 */
export function AgentMessageSkeleton({ count = 3, className }: AgentMessageSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: count }).map((_, index) =>
        index % 2 === 0 ? <UserMessageSkeleton key={index} /> : <AssistantMessageSkeleton key={index} />,
      )}
    </div>
  )
}
