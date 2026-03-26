'use client'

import { ArrowRight, LoaderCircle } from 'lucide-react'
import { useState } from 'react'

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from '@/components/ui/select'
import { cn } from '@/lib/shadcn/utils'
import { useStatusActions } from '@/property/hooks/use-status-actions'
import { getStatusDefinition, getStatusDefinitions, StatusIcon } from './status-utils'
import type { RendererComponent } from '@/property/types/property-types'
import type { ResolvedStatusAction, StatusDefinition } from '@repo/shared'

type EditableStatusOption = {
  icon?: string
  key: string
  primaryLabel: string
  statusId: string
  secondaryLabel?: string
  value: string
}

type EditableStatusViewProps = {
  currentStatus: StatusDefinition | null
  emptyMessage: string
  disabled?: boolean
  errorMessage?: string
  isLoading?: boolean
  onOpenChange: (open: boolean) => void
  onSelectOption: (option: EditableStatusOption) => void
  options: EditableStatusOption[]
  open: boolean
}

export const EditableStatusView = ({
  currentStatus,
  emptyMessage,
  disabled,
  errorMessage,
  isLoading,
  onOpenChange,
  onSelectOption,
  options,
  open,
}: EditableStatusViewProps) => {
  return (
    <Select
      open={open}
      onOpenChange={onOpenChange}
      value={undefined}
      onValueChange={value => {
        const selectedOption = options.find(option => option.key === value)
        if (selectedOption) {
          onSelectOption(selectedOption)
        }
      }}
      disabled={disabled}>
      <SelectTrigger
        className={cn(
          'flex items-center gap-2 bg-transparent',
          'border-transparent shadow-none',
          '[&>svg]:hidden',
          'hover:border-border focus-visible:border-border hover:shadow-sm focus-visible:shadow-sm focus-visible:ring-[1px]',
          'hover:cursor-pointer',
          'w-[var(--select-options-width)]',
        )}>
        <span className="flex min-w-0 items-center gap-2">
          <StatusIcon iconName={currentStatus?.icon} statusId={currentStatus?.id} />
          <span className="truncate">{currentStatus?.label ?? 'Status'}</span>
        </span>
      </SelectTrigger>
      <SelectContent align="start" sideOffset={4} className="w-[var(--radix-select-trigger-width)] min-w-72">
        <SelectGroup>
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 px-2 py-2 text-sm">
              <LoaderCircle className="size-4 animate-spin" />
              Loading available actions...
            </div>
          ) : null}
          {!isLoading && errorMessage ? <div className="px-2 py-2 text-sm text-red-500">{errorMessage}</div> : null}
          {!isLoading && !errorMessage && options.length === 0 ? (
            <div className="text-muted-foreground px-2 py-2 text-sm">{emptyMessage}</div>
          ) : null}
          {!isLoading && !errorMessage
            ? options.map(option => (
                <SelectItem key={option.key} value={option.key} className="items-start py-2">
                  <div className="min-w-0 space-y-1">
                    {option.secondaryLabel ? (
                      <div className="truncate text-sm font-medium">{option.primaryLabel}</div>
                    ) : (
                      <div className="flex min-w-0 items-center gap-2">
                        <StatusIcon iconName={option.icon} statusId={option.statusId} className="size-4" />
                        <div className="truncate text-sm font-medium">{option.primaryLabel}</div>
                      </div>
                    )}
                    {option.secondaryLabel ? (
                      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <ArrowRight className="size-3.5 shrink-0" />
                        <StatusIcon iconName={option.icon} statusId={option.statusId} className="size-3.5" />
                        <span className="truncate">{option.secondaryLabel}</span>
                      </div>
                    ) : null}
                  </div>
                </SelectItem>
              ))
            : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export const EditableStatus: RendererComponent = ({ value, onChange, disabled, meta, row }) => {
  const [open, setOpen] = useState(false)
  const currentStatusId = typeof value === 'string' ? value : undefined
  const issueId = typeof row?.id === 'number' ? row.id : undefined
  const isExistingIssue = typeof issueId === 'number'

  const { data, error, isLoading } = useStatusActions({
    issueId,
    currentStatusId,
    enabled: isExistingIssue && open && !disabled,
  })

  const resolvedCurrentStatusId = isExistingIssue ? (data?.currentStatusId ?? currentStatusId) : currentStatusId
  const currentStatus = getStatusDefinition(meta, resolvedCurrentStatusId)
  const createOptions: EditableStatusOption[] = getStatusDefinitions(meta).map(status => ({
    icon: status.icon,
    key: status.id,
    primaryLabel: status.label,
    statusId: status.id,
    value: status.id,
  }))
  const existingIssueOptions: EditableStatusOption[] = (data?.actions ?? []).map((action: ResolvedStatusAction) => ({
    icon: action.icon,
    key: `${action.toStatusId}-${action.actionLabel}`,
    primaryLabel: action.actionLabel,
    statusId: action.toStatusId,
    secondaryLabel: action.label,
    value: action.toStatusId,
  }))
  const options = isExistingIssue ? existingIssueOptions : createOptions
  const errorMessage = !isExistingIssue
    ? createOptions.length === 0
      ? 'Status config is unavailable.'
      : undefined
    : error instanceof Error
      ? error.message
      : undefined

  return (
    <EditableStatusView
      currentStatus={currentStatus}
      emptyMessage={isExistingIssue ? 'No available actions' : 'No statuses available'}
      disabled={disabled}
      errorMessage={errorMessage}
      isLoading={isExistingIssue ? isLoading : false}
      onOpenChange={setOpen}
      onSelectOption={option => {
        setOpen(false)
        onChange?.(option.value)
      }}
      options={options}
      open={open}
    />
  )
}
