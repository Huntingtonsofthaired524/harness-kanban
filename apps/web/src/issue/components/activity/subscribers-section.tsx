'use client'

import { toast } from 'sonner'
import React from 'react'

import { GeometricUserAvatar } from '@/components/common/geometric-user-avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/hooks/use-user'
import { useIssueActivities } from '@/issue/hooks/use-issue-activities'
import { useSubscribeIssue } from '@/issue/hooks/use-subscribe-issue'
import { useUnsubscribeIssue } from '@/issue/hooks/use-unsubscribe-issue'
import { User } from '@repo/shared'

const SubscriberAvatarView: React.FC<{ user: User | null }> = ({ user }) => {
  const profile = user
    ? {
        id: user.id,
        username: user.username,
        imageUrl: user.imageUrl,
      }
    : null

  return <GeometricUserAvatar user={profile} size={16} className="h-4 w-4 border border-white" />
}

const SubscriberAvatar: React.FC<{ userId: string }> = ({ userId }) => {
  const { user } = useUser(userId)

  return <SubscriberAvatarView user={user} />
}

interface SubscribersSectionProps {
  issueId: number
}

interface SubscribersSectionViewProps {
  user: User | null
  subscriberIds: string[]
  isLoading: boolean
  isUserSubscribed: boolean
  isMutating: boolean
  onToggleSubscription: () => Promise<void>
}

export const SubscribersSectionView: React.FC<SubscribersSectionViewProps> = ({
  user,
  subscriberIds,
  isLoading,
  isUserSubscribed,
  isMutating,
  onToggleSubscription,
}) => {
  if (isLoading) return <Skeleton className="h-6 w-12" />

  return (
    <div className="flex items-center gap-3">
      {user && (
        <Button
          size="sm"
          variant="ghost"
          className="text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          onClick={() => {
            void onToggleSubscription()
          }}
          disabled={isMutating}>
          {isMutating ? 'Loading...' : isUserSubscribed ? 'Unsubscribe' : 'Subscribe'}
        </Button>
      )}

      <div className="flex items-center">
        {subscriberIds.length > 0 && (
          <div className="flex -space-x-2">
            {subscriberIds.map(userId => (
              <div key={userId}>
                <SubscriberAvatar userId={userId} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const SubscribersSection: React.FC<SubscribersSectionProps> = ({ issueId }) => {
  const { data, isLoading } = useIssueActivities(issueId)
  const subscriberIds = data?.subscriberIds ?? []

  const { user } = useUser()
  const isUserSubscribed = user?.id ? subscriberIds.includes(user.id) : false

  const { subscribeToIssue, isMutating: isSubscribing } = useSubscribeIssue(issueId)
  const { unsubscribeFromIssue, isMutating: isUnsubscribing } = useUnsubscribeIssue(issueId)

  const handleToggleSubscription = async () => {
    if (!user?.id) return
    try {
      if (isUserSubscribed) {
        await unsubscribeFromIssue({ userIds: [user.id] })
      } else {
        await subscribeToIssue({ userIds: [user.id] })
      }
      toast.success(isUserSubscribed ? 'Unsubscribed from issue' : 'Subscribed to issue')
    } catch {
      toast.error('Failed to toggle subscription')
    }
  }

  return (
    <SubscribersSectionView
      user={user}
      subscriberIds={subscriberIds}
      isLoading={isLoading}
      isUserSubscribed={isUserSubscribed}
      isMutating={isSubscribing || isUnsubscribing}
      onToggleSubscription={handleToggleSubscription}
    />
  )
}
