'use client'

import React from 'react'

import { useUser } from '@/hooks/use-user'
import { cn } from '@/lib/shadcn/utils'
import { User } from '@repo/shared'
import { GeometricUserAvatar } from './geometric-user-avatar'

export interface UserDisplayProps {
  userId: string
  className?: string
}

interface UserDisplayViewProps extends UserDisplayProps {
  user: User | null
  isLoading: boolean
}

export const UserDisplayView: React.FC<UserDisplayViewProps> = ({ userId, className, user, isLoading }) => {
  if (isLoading) {
    return <span className={cn('text-sm', className)}>...</span>
  }

  if (!user) {
    return <span className={cn('text-sm', className)}>{userId}</span>
  }

  const profile = {
    id: user.id,
    username: user.username,
    imageUrl: user.imageUrl,
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <GeometricUserAvatar user={profile} size={16} className="h-4 w-4" />
      <span className="truncate text-xs font-medium">{user.username}</span>
    </span>
  )
}

export const UserDisplay: React.FC<UserDisplayProps> = ({ userId, className }) => {
  const { user, isLoading } = useUser(userId)

  return <UserDisplayView userId={userId} className={className} user={user} isLoading={isLoading} />
}
