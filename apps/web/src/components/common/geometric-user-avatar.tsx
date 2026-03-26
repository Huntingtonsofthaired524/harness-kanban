'use client'

import React from 'react'

import { Avatar, AvatarImage, GeometricAvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/shadcn/utils'
import type { AvatarVariant } from '@/components/ui/geometric-avatar'

interface GeometricUserAvatarProps {
  user: {
    id?: string
    name?: string | null
    username?: string | null
    email?: string | null
    image?: string | null
    imageUrl?: string | null
    avatar?: string | null
    avatarUrl?: string | null
  } | null
  size?: number
  variant?: AvatarVariant
  className?: string
}

/**
 * User avatar component with geometric pattern fallback
 * Uses boring-avatars to generate a unique geometric pattern based on the user's name
 */
export function GeometricUserAvatar({ user, size = 40, variant = 'beam', className }: GeometricUserAvatarProps) {
  // Get the best available image URL
  const imageUrl = user?.image || user?.imageUrl || user?.avatar || user?.avatarUrl

  // Get the best available name for the geometric pattern
  const displayName = user?.name || user?.username || user?.email || user?.id || 'Anonymous'

  return (
    <Avatar className={cn(`size-[${size}px]`, className)} style={{ width: size, height: size }}>
      {imageUrl && <AvatarImage src={imageUrl} alt={displayName || ''} />}
      <GeometricAvatarFallback name={displayName} variant={variant} />
    </Avatar>
  )
}
