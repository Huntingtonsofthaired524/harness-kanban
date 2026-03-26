'use client'

import { UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { cloneElement, isValidElement, useCallback, useEffect, useRef, useState } from 'react'

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from '@/components/ui/select'
import { cn } from '@/lib/shadcn/utils'
import {
  getIssueDragId,
  ProjectKanbanCardData,
  ProjectKanbanOptionDisplay,
} from '@/project/components/project-kanban-utils'
import { PropertyOptionItem } from '@/property/types/property-types'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

const CLEAR_OPTION_VALUE = '__clear'
const CARD_OPEN_DISTANCE_PX = 5
const INTERACTIVE_SELECTOR = '[data-kanban-interactive="true"]'

const normalizeIcon = (icon: React.ReactNode, className: string) => {
  if (!isValidElement(icon)) {
    return icon
  }

  const element = icon as React.ReactElement<{ className?: string }>
  return cloneElement(element, {
    className: cn(className, element.props.className),
  })
}

const stopCardInteraction = (event: React.SyntheticEvent) => {
  event.stopPropagation()
}

const isInteractiveTarget = (target: EventTarget | null) => {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
}

const MetaPillContent = ({
  value,
  fallbackIcon,
  fallbackLabel,
}: {
  value: ProjectKanbanOptionDisplay | null
  fallbackIcon: React.ReactNode
  fallbackLabel: string
}) => {
  const icon = value?.icon ? normalizeIcon(value.icon, 'size-3.5 shrink-0') : fallbackIcon

  return (
    <>
      {icon}
      <span className="truncate">{value?.label ?? fallbackLabel}</span>
    </>
  )
}

const StaticMetaPill = ({
  value,
  fallbackIcon,
  fallbackLabel,
}: {
  value: ProjectKanbanOptionDisplay | null
  fallbackIcon: React.ReactNode
  fallbackLabel: string
}) => {
  return (
    <div className="text-muted-foreground inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-normal">
      <MetaPillContent value={value} fallbackIcon={fallbackIcon} fallbackLabel={fallbackLabel} />
    </div>
  )
}

const KanbanMetaSelect = ({
  ariaLabel,
  clearLabel,
  disabled = false,
  fallbackIcon,
  fallbackLabel,
  onInteractionActiveChange,
  onValueChange,
  options,
  value,
  visualValue,
}: {
  ariaLabel: string
  clearLabel?: string
  disabled?: boolean
  fallbackIcon: React.ReactNode
  fallbackLabel: string
  onInteractionActiveChange?: (active: boolean) => void
  onValueChange: (value: string | null) => void
  options: PropertyOptionItem[]
  value: string | null
  visualValue: ProjectKanbanOptionDisplay | null
}) => {
  const selectValue = value ?? CLEAR_OPTION_VALUE
  const [open, setOpen] = useState(false)

  useEffect(() => {
    return () => {
      onInteractionActiveChange?.(false)
    }
  }, [onInteractionActiveChange])

  return (
    <div
      data-kanban-interactive="true"
      className="max-w-full"
      onPointerDownCapture={stopCardInteraction}
      onClick={stopCardInteraction}
      onKeyDownCapture={stopCardInteraction}>
      <Select
        open={open}
        onOpenChange={nextOpen => {
          setOpen(nextOpen)
          onInteractionActiveChange?.(nextOpen)
        }}
        value={selectValue}
        onValueChange={nextValue => onValueChange(nextValue === CLEAR_OPTION_VALUE ? null : nextValue)}
        disabled={disabled}>
        <SelectTrigger
          size="sm"
          aria-label={ariaLabel}
          className={cn(
            'h-auto max-w-full border-transparent bg-transparent p-0 shadow-none',
            'hover:border-transparent hover:bg-transparent hover:shadow-none',
            'focus-visible:border-transparent focus-visible:shadow-none focus-visible:ring-0',
            '[&>svg:last-child]:hidden',
          )}>
          <span className="text-muted-foreground inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-normal">
            <MetaPillContent value={visualValue} fallbackIcon={fallbackIcon} fallbackLabel={fallbackLabel} />
          </span>
        </SelectTrigger>
        <SelectContent align="start" sideOffset={6} className="w-[var(--radix-select-trigger-width)] min-w-44">
          <SelectGroup>
            {clearLabel ? (
              <SelectItem value={CLEAR_OPTION_VALUE}>
                {normalizeIcon(fallbackIcon, 'size-4 shrink-0')}
                <span>{clearLabel}</span>
              </SelectItem>
            ) : null}
            {options.map(option => (
              <SelectItem key={String(option.value)} value={String(option.value)}>
                {option.icon ? normalizeIcon(option.icon, 'size-4 shrink-0') : null}
                <span>{option.label}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export interface ProjectKanbanCardViewProps {
  assigneeOptions?: PropertyOptionItem[]
  card: ProjectKanbanCardData
  isDragOverlay?: boolean
  isDragging?: boolean
  isPending?: boolean
  onOpenIssue?: (href: string) => void
  onUpdateAssignee?: (issueId: number, value: string | null) => void
  onUpdatePriority?: (issueId: number, value: string | null) => void
  priorityOptions?: PropertyOptionItem[]
  rootProps?: React.HTMLAttributes<HTMLDivElement>
}

export const ProjectKanbanCardView = React.forwardRef<HTMLDivElement, ProjectKanbanCardViewProps>(
  (
    {
      assigneeOptions = [],
      card,
      isDragging = false,
      isPending = false,
      isDragOverlay = false,
      onOpenIssue,
      onUpdateAssignee,
      onUpdatePriority,
      priorityOptions = [],
      rootProps,
    },
    ref,
  ) => {
    const pointerDownRef = useRef<{ x: number; y: number } | null>(null)
    const interactiveControlActiveRef = useRef(false)
    const interactiveResetTimeoutRef = useRef<number | null>(null)

    useEffect(() => {
      return () => {
        if (interactiveResetTimeoutRef.current !== null) {
          window.clearTimeout(interactiveResetTimeoutRef.current)
        }
      }
    }, [])

    const handleInteractiveControlActiveChange = useCallback((active: boolean) => {
      if (interactiveResetTimeoutRef.current !== null) {
        window.clearTimeout(interactiveResetTimeoutRef.current)
        interactiveResetTimeoutRef.current = null
      }

      if (active) {
        interactiveControlActiveRef.current = true
        return
      }

      interactiveResetTimeoutRef.current = window.setTimeout(() => {
        interactiveControlActiveRef.current = false
        interactiveResetTimeoutRef.current = null
      }, 0)
    }, [])

    const handlePointerDownCapture = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
      if (interactiveControlActiveRef.current || isInteractiveTarget(event.target)) {
        pointerDownRef.current = null
        return
      }

      pointerDownRef.current = {
        x: event.clientX,
        y: event.clientY,
      }
    }, [])

    const handlePointerUp = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (
          isDragOverlay ||
          !onOpenIssue ||
          isPending ||
          interactiveControlActiveRef.current ||
          isInteractiveTarget(event.target)
        ) {
          pointerDownRef.current = null
          return
        }

        const pointerDown = pointerDownRef.current
        pointerDownRef.current = null

        if (!pointerDown) {
          return
        }

        const deltaX = Math.abs(event.clientX - pointerDown.x)
        const deltaY = Math.abs(event.clientY - pointerDown.y)

        if (deltaX <= CARD_OPEN_DISTANCE_PX && deltaY <= CARD_OPEN_DISTANCE_PX) {
          onOpenIssue(card.href)
        }
      },
      [card.href, isDragOverlay, isPending, onOpenIssue],
    )

    const handlePointerCancel = useCallback(() => {
      pointerDownRef.current = null
    }, [])

    return (
      <div
        ref={ref}
        {...rootProps}
        className={cn(
          'bg-card ring-border/60 flex min-h-32 select-none flex-col gap-3 rounded-xl border p-3 shadow-sm transition-shadow',
          !isDragOverlay && !isPending && 'cursor-pointer hover:shadow-md',
          !isDragOverlay && isPending && 'cursor-progress',
          isDragging && 'opacity-50 shadow-none',
          isPending && 'opacity-70',
          isDragOverlay && 'shadow-lg ring-1',
          rootProps?.className,
        )}
        onPointerDownCapture={handlePointerDownCapture}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}>
        <div className="min-w-0 space-y-1">
          <div className="text-muted-foreground truncate text-[11px] font-medium">Issue {card.issueId}</div>
          <div className="line-clamp-2 text-sm font-medium leading-5">{card.title}</div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          {isDragOverlay || !onUpdatePriority ? (
            <StaticMetaPill
              value={card.priority}
              fallbackLabel="No priority"
              fallbackIcon={<span className="bg-muted-foreground size-1.5 rounded-full" />}
            />
          ) : (
            <KanbanMetaSelect
              ariaLabel={`Update priority for issue ${card.issueId}`}
              disabled={isPending}
              fallbackLabel="No priority"
              fallbackIcon={<span className="bg-muted-foreground size-1.5 rounded-full" />}
              onInteractionActiveChange={handleInteractiveControlActiveChange}
              onValueChange={value => onUpdatePriority(card.issueId, value)}
              options={priorityOptions}
              value={card.priorityValue}
              visualValue={card.priority}
            />
          )}

          {isDragOverlay || !onUpdateAssignee ? (
            <StaticMetaPill
              value={card.assignee}
              fallbackLabel="Unassigned"
              fallbackIcon={<UserRound className="size-3.5 shrink-0" />}
            />
          ) : (
            <KanbanMetaSelect
              ariaLabel={`Update assignee for issue ${card.issueId}`}
              clearLabel="Unassigned"
              disabled={isPending}
              fallbackLabel="Unassigned"
              fallbackIcon={<UserRound className="size-3.5 shrink-0" />}
              onInteractionActiveChange={handleInteractiveControlActiveChange}
              onValueChange={value => onUpdateAssignee(card.issueId, value)}
              options={assigneeOptions}
              value={card.assigneeValue}
              visualValue={card.assignee}
            />
          )}
        </div>
      </div>
    )
  },
)

ProjectKanbanCardView.displayName = 'ProjectKanbanCardView'

interface ProjectKanbanCardProps {
  assigneeOptions?: PropertyOptionItem[]
  card: ProjectKanbanCardData
  isPending?: boolean
  onUpdateAssignee?: (issueId: number, value: string | null) => void
  onUpdatePriority?: (issueId: number, value: string | null) => void
  priorityOptions?: PropertyOptionItem[]
}

export const ProjectKanbanCard = ({
  assigneeOptions = [],
  card,
  isPending = false,
  onUpdateAssignee,
  onUpdatePriority,
  priorityOptions = [],
}: ProjectKanbanCardProps) => {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: getIssueDragId(card.issueId),
    data: {
      issueId: card.issueId,
      statusId: card.statusId,
    },
    disabled: isPending,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const handleOpenIssue = useCallback(
    (href: string) => {
      router.push(href)
    },
    [router],
  )

  return (
    <ProjectKanbanCardView
      ref={setNodeRef}
      assigneeOptions={assigneeOptions}
      card={card}
      isPending={isPending}
      isDragging={isDragging}
      onOpenIssue={handleOpenIssue}
      onUpdateAssignee={onUpdateAssignee}
      onUpdatePriority={onUpdatePriority}
      priorityOptions={priorityOptions}
      rootProps={{
        ...attributes,
        ...listeners,
        className: 'touch-none',
        onKeyDown: event => {
          if ((event.key === 'Enter' || event.key === ' ') && !event.defaultPrevented) {
            event.preventDefault()
            handleOpenIssue(card.href)
          }
        },
        style,
      }}
    />
  )
}
