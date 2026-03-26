'use client'

import {
  BadgeCheck,
  Circle,
  CircleHelp,
  CircleSlash,
  ClipboardCheck,
  Clock3,
  FileText,
  GitPullRequest,
  Hammer,
  LifeBuoy,
} from 'lucide-react'

import { cn } from '@/lib/shadcn/utils'
import { PropertyMeta } from '@/property/types/property-types'
import { findStatusDefinition, getStatusPropertyConfig } from '@repo/shared/property/status-config'
import type { StatusDefinition } from '@repo/shared/property/types'
import type { LucideIcon } from 'lucide-react'

const STATUS_ICON_MAP: Record<string, LucideIcon> = {
  BadgeCheck,
  Circle,
  CircleHelp,
  CircleSlash,
  ClipboardCheck,
  Clock3,
  FileText,
  GitPullRequest,
  Hammer,
  LifeBuoy,
}

const STATUS_ICON_COLOR_MAP: Record<string, string> = {
  todo: 'text-slate-500',
  queued: 'text-amber-500',
  planning: 'text-sky-500',
  needs_clarification: 'text-orange-500',
  plan_in_review: 'text-violet-500',
  in_progress: 'text-blue-600',
  needs_help: 'text-rose-500',
  in_review: 'text-indigo-500',
  completed: 'text-emerald-600',
  canceled: 'text-zinc-500',
}

export const getStatusConfig = (meta: Pick<PropertyMeta, 'config'>) => {
  return getStatusPropertyConfig({ config: meta.config })
}

export const getStatusDefinitions = (meta: Pick<PropertyMeta, 'config'>): StatusDefinition[] => {
  return getStatusConfig(meta)?.statuses ?? []
}

export const getStatusDefinition = (meta: Pick<PropertyMeta, 'config'>, statusId: string | null | undefined) => {
  const config = getStatusConfig(meta)
  if (!config) {
    return null
  }

  return findStatusDefinition(config, statusId)
}

export const getStatusIconColorClass = (statusId: string | null | undefined) => {
  if (!statusId) {
    return 'text-slate-500'
  }

  return STATUS_ICON_COLOR_MAP[statusId] ?? 'text-slate-500'
}

export const StatusIcon = ({
  iconName,
  statusId,
  className,
}: {
  iconName: string | null | undefined
  statusId?: string | null | undefined
  className?: string
}) => {
  const Icon = (iconName && STATUS_ICON_MAP[iconName]) || Circle
  return <Icon className={cn('size-4 shrink-0', getStatusIconColorClass(statusId), className)} />
}
