'use client'

import BoringAvatar from 'boring-avatars'
import React from 'react'

export type AvatarVariant = 'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus'

interface GeometricAvatarProps {
  name: string
  size?: number
  variant?: AvatarVariant
  colors?: string[]
  className?: string
}

const DEFAULT_COLORS = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']

export function GeometricAvatar({
  name,
  size = 40,
  variant = 'beam',
  colors = DEFAULT_COLORS,
  className,
}: GeometricAvatarProps) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <BoringAvatar size={size} name={name} variant={variant} colors={colors} />
    </div>
  )
}

/**
 * Generate a consistent color palette from a string
 * Useful when you want the same user to always have the same color scheme
 */
export function generateColorsFromString(str: string | undefined): string[] {
  if (!str) {
    return DEFAULT_COLORS
  }
  const baseColors = [
    '#264653',
    '#2a9d8f',
    '#e9c46a',
    '#f4a261',
    '#e76f51',
    '#1a535c',
    '#4ecdc4',
    '#ff6b6b',
    '#ffe66d',
    '#95e1d3',
  ]

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const startIndex = Math.abs(hash) % baseColors.length
  const result: string[] = []

  for (let i = 0; i < 5; i++) {
    const index = (startIndex + i) % baseColors.length
    const color = baseColors[index]
    if (color) {
      result.push(color)
    }
  }

  return result
}
