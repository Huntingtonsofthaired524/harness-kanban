'use client'

import React from 'react'

import { cn } from '@/lib/shadcn/utils'
import { getStatusDropId, ProjectKanbanColumnData } from '@/project/components/project-kanban-utils'
import { StatusIcon } from '@/property/components/fields/status/status-utils'
import { useDroppable } from '@dnd-kit/core'

export interface ProjectKanbanColumnViewProps {
  column: ProjectKanbanColumnData
  isDraggedOver?: boolean
  children?: React.ReactNode
}

export const ProjectKanbanColumnView = ({ column, isDraggedOver = false, children }: ProjectKanbanColumnViewProps) => {
  return (
    <section
      className={cn(
        'bg-muted/35 flex h-full min-h-0 w-[19rem] shrink-0 flex-col rounded-2xl border p-3',
        isDraggedOver && 'border-primary bg-primary/5 shadow-sm',
      )}>
      <header className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <StatusIcon iconName={column.iconName} statusId={column.statusId} className="size-4" />
          <h3 className="truncate text-sm font-medium">{column.label}</h3>
        </div>
        <span className="text-muted-foreground rounded-full border px-2 py-0.5 text-xs">{column.cards.length}</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {column.cards.length > 0 ? (
          children
        ) : (
          <div className="text-muted-foreground border-border/70 rounded-xl border border-dashed px-3 py-6 text-center text-sm">
            No issues
          </div>
        )}
      </div>
    </section>
  )
}

export const ProjectKanbanColumn = ({ column, isDraggedOver = false, children }: ProjectKanbanColumnViewProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: getStatusDropId(column.statusId),
    data: {
      statusId: column.statusId,
    },
  })

  return (
    <div ref={setNodeRef} className="flex h-full min-h-0">
      <ProjectKanbanColumnView column={column} isDraggedOver={isDraggedOver || isOver}>
        {children}
      </ProjectKanbanColumnView>
    </div>
  )
}
