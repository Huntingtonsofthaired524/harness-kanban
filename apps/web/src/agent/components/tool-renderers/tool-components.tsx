'use client'

import { CheckCircleIcon, ChevronDownIcon, ClockIcon, Loader2Icon, XCircleIcon } from 'lucide-react'
import React, { useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { IssueTableRow } from '@/issue/components/issue-table-row'
import { convertIssueToRow } from '@/issue/utils/transform'
import { cn } from '@/lib/shadcn/utils'
import { useServerProperties } from '@/property/hooks/use-properties'
import { PropertyTableColumnLayout } from '@/property/types/property-types'
import { SystemPropertyId } from '@repo/shared'
import type { PropertyMeta } from '@/property/types/property-types'
import type {
  AddMultipleTodosOutput,
  CreateIssueInput,
  CreateIssueOutput,
  DeleteIssueInput,
  DeleteIssueOutput,
  DeleteMultipleTodosOutput,
  GetAvailableUsersOutput,
  GetIssuesOutput,
  ListTodosOutput,
  PropertyDefinition,
  ToggleMultipleTodosOutput,
  UpdateIssueInput,
  UpdateIssueOutput,
} from '@repo/shared'
import type { ToolUIPart } from 'ai'
import type { JSX } from 'react'

// Common type for all tool components
export type ToolComponentProps = {
  part: ToolUIPart
}

/**
 * Query Properties Tool
 * Queries all property definitions in the system
 */
export function QueryPropertiesTool({ part }: ToolComponentProps): JSX.Element {
  const output = 'output' in part ? (part.output as { properties?: PropertyDefinition[] }) : null
  const properties = output?.properties ?? []
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = 'Query Properties'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Querying properties...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = `${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} found`
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to query properties'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <Collapsible defaultOpen={true} className="not-prose group mb-4 w-full rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in space-y-4 p-4 pt-0 outline-none',
        )}>
        {isSuccess ? (
          properties.length === 0 ? (
            <div className="text-muted-foreground text-sm">No properties found</div>
          ) : (
            <div className="space-y-2">
              {properties.map(prop => (
                <div key={prop.id} className="flex items-center justify-between gap-3">
                  <span className="text-foreground text-sm font-medium">{prop.name}</span>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {prop.type}
                  </Badge>
                </div>
              ))}
            </div>
          )
        ) : isError ? (
          <div className="text-destructive text-sm">{errorText || 'Failed to query properties'}</div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Create Issue Tool
 * Creates one or more issues with property values
 */
export function CreateIssueTool({ part }: ToolComponentProps): JSX.Element {
  const output = 'output' in part ? (part.output as CreateIssueOutput) : null
  const results = output?.results ?? []
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Get issues from input if available
  const input = 'input' in part ? (part.input as CreateIssueInput) : null
  const issues = input?.issues ?? []

  // Filter successful results
  const successfulResults = results.filter(r => r.success && r.issueId)
  const hasSuccess = successfulResults.length > 0
  const hasErrors = errorText || results.some(r => !r.success)

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available' && hasSuccess
  const isError = part.state === 'output-error' || (part.state === 'output-available' && hasErrors && !hasSuccess)

  // State-based title and icon
  let title = 'Create Issue'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = issues.length > 1 ? `Creating ${issues.length} issues...` : 'Creating issue...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = successfulResults.length === 1 ? 'Issue created' : `${successfulResults.length} issues created`
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to create issue'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <Collapsible defaultOpen={true} className="not-prose group mb-4 w-full rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in space-y-4 p-4 pt-0 outline-none',
        )}>
        {isSuccess ? (
          <div className="space-y-2">
            {successfulResults.map((result, index) => {
              const titleValue = issues[index]?.propertyValues?.find(pv => pv.propertyId === SystemPropertyId.TITLE)
                ?.value as string | undefined

              return (
                <Button
                  key={result.issueId}
                  variant="outline"
                  onClick={() => window.open(`/issues/${result.issueId}`, '_blank')}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left font-normal">
                  <span className="flex items-center gap-2 overflow-hidden">
                    <span className="text-muted-foreground text-sm font-medium">#{result.issueId}</span>
                    <span className="truncate text-sm font-medium">{titleValue || 'Untitled Issue'}</span>
                  </span>
                  <span className="text-muted-foreground shrink-0 text-sm">→</span>
                </Button>
              )
            })}
          </div>
        ) : isError ? (
          <div className="text-destructive text-sm">
            {errorText ||
              results
                .filter(r => !r.success)
                .map(r => r.errors?.join(', '))
                .join('; ') ||
              'Failed to create issue'}
          </div>
        ) : isRunning && issues.length > 0 ? (
          <div className="space-y-2">
            {issues.map((issue, index) => {
              const titleValue = issue.propertyValues?.find(pv => pv.propertyId === SystemPropertyId.TITLE)?.value as
                | string
                | undefined
              return (
                <div key={index} className="text-muted-foreground text-sm">
                  {titleValue || `Issue ${index + 1}`}
                </div>
              )
            })}
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Get Available Users Tool
 * Gets all available users in the workspace
 */
export function GetAvailableUsersTool({ part }: ToolComponentProps): JSX.Element {
  const output = 'output' in part ? (part.output as GetAvailableUsersOutput) : null
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = 'Get Available Users'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Getting available users...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = 'Available users retrieved'
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to get available users'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <Collapsible defaultOpen={true} className="not-prose group mb-4 w-full rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in space-y-4 p-4 pt-0 outline-none',
        )}>
        {isSuccess && output ? (
          <div className="text-muted-foreground text-sm">
            {output.name} ({output.email})
          </div>
        ) : isError ? (
          <div className="text-destructive text-sm">{errorText || 'Failed to get available users'}</div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Get Current User Tool
 * Gets current user information
 */
export function GetCurrentUserTool({ part }: ToolComponentProps): JSX.Element {
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = 'Get Current User'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Verifying identity...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = 'Identity confirmed'
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to verify identity'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <div className="not-prose mb-4 flex w-full items-center gap-2 rounded-md border p-3">
      {icon}
      <span className="text-sm font-medium">{title}</span>
      {isError && errorText ? <span className="text-destructive ml-2 text-sm">{errorText}</span> : null}
    </div>
  )
}

/**
 * List Todos Tool
 * Lists all todo items with checkboxes in the current chat
 */
export function ListTodosTool({ part }: ToolComponentProps): JSX.Element {
  const output = 'output' in part ? (part.output as ListTodosOutput) : null
  const items = output?.items ?? []
  const completedCount = output?.completedCount ?? 0
  const totalCount = output?.count ?? 0
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = 'List Todos'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Listing todos...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = totalCount === 0 ? 'No todos' : `${completedCount}/${totalCount} completed`
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to list todos'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <Collapsible defaultOpen={true} className="not-prose group mb-4 w-full rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in space-y-4 p-4 pt-0 outline-none',
        )}>
        {isSuccess ? (
          items.length === 0 ? (
            <div className="text-muted-foreground text-sm">No todos yet</div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <Checkbox
                    checked={item.completed}
                    disabled
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground mt-0.5"
                  />
                  <span
                    className={`text-sm ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )
        ) : isError ? (
          <div className="text-destructive text-sm">{errorText || 'Failed to list todos'}</div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Add Multiple Todos Tool
 * Adds multiple todo items to the current chat in a single operation
 */
export function AddMultipleTodosTool({ part }: ToolComponentProps): JSX.Element {
  const input = 'input' in part ? (part.input as { items?: { text: string }[] }) : null
  const output = 'output' in part ? (part.output as AddMultipleTodosOutput) : null
  const todos = output?.todos ?? []
  const errorText = 'errorText' in part ? part.errorText : undefined
  const inputItems = input?.items ?? []

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = 'Add Todos'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    const count = inputItems.length
    title = count > 1 ? `Adding ${count} todos...` : 'Adding todo...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = todos.length === 1 ? 'Added 1 todo' : `Added ${todos.length} todos`
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to add todos'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <Collapsible defaultOpen={true} className="not-prose group mb-4 w-full rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in space-y-4 p-4 pt-0 outline-none',
        )}>
        {isSuccess ? (
          todos.length > 0 && (
            <div className="space-y-2">
              {todos.map(todo => (
                <div key={todo.id} className="flex items-start gap-3">
                  <Checkbox
                    checked={false}
                    disabled
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground mt-0.5"
                  />
                  <span className="text-foreground text-sm">{todo.text}</span>
                </div>
              ))}
            </div>
          )
        ) : isError ? (
          <div className="text-destructive text-sm">{errorText || 'Failed to add todos'}</div>
        ) : isRunning && inputItems.length > 0 ? (
          <div className="space-y-2">
            {inputItems.map((item, index) => (
              <div key={index} className="text-muted-foreground text-sm">
                {item.text}
              </div>
            ))}
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Toggle Multiple Todos Tool
 * Toggles the completed status of multiple todo items in a single operation
 */
export function ToggleMultipleTodosTool({ part }: ToolComponentProps): JSX.Element {
  const output = 'output' in part ? (part.output as ToggleMultipleTodosOutput) : null
  const toggled = output?.toggled ?? []
  const notFound = output?.notFound ?? []
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = 'Toggle Todos'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Toggling todos...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = toggled.length === 1 ? 'Toggled 1 todo' : `Toggled ${toggled.length} todos`
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to toggle todos'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <Collapsible defaultOpen={true} className="not-prose group mb-4 w-full rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in space-y-4 p-4 pt-0 outline-none',
        )}>
        {isSuccess ? (
          <div className="space-y-3">
            {toggled.length > 0 && (
              <div className="space-y-2">
                {toggled.map(todo => (
                  <div key={todo.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={todo.completed}
                      disabled
                      className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground mt-0.5"
                    />
                    <span
                      className={`text-sm ${todo.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {todo.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {notFound.length > 0 && (
              <div className="text-muted-foreground text-xs">
                {notFound.length} item{notFound.length !== 1 ? 's' : ''} not found
              </div>
            )}
          </div>
        ) : isError ? (
          <div className="text-destructive text-sm">{errorText || 'Failed to toggle todos'}</div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Delete Multiple Todos Tool
 * Deletes multiple todo items from the current chat in a single operation
 */
export function DeleteMultipleTodosTool({ part }: ToolComponentProps): JSX.Element {
  const output = 'output' in part ? (part.output as DeleteMultipleTodosOutput) : null
  const deleted = output?.deleted ?? []
  const notFound = output?.notFound ?? []
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = 'Delete Todos'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Deleting todos...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = deleted.length === 1 ? 'Deleted 1 todo' : `Deleted ${deleted.length} todos`
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to delete todos'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <Collapsible defaultOpen={true} className="not-prose group mb-4 w-full rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in space-y-4 p-4 pt-0 outline-none',
        )}>
        {isSuccess ? (
          <div className="space-y-3">
            {deleted.length > 0 && (
              <div className="space-y-2">
                {deleted.map(todo => (
                  <div key={todo.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={todo.completed}
                      disabled
                      className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground mt-0.5"
                    />
                    <span className="text-muted-foreground text-sm line-through">{todo.text}</span>
                  </div>
                ))}
              </div>
            )}
            {notFound.length > 0 && (
              <div className="text-muted-foreground text-xs">
                {notFound.length} item{notFound.length !== 1 ? 's' : ''} not found
              </div>
            )}
          </div>
        ) : isError ? (
          <div className="text-destructive text-sm">{errorText || 'Failed to delete todos'}</div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Issue List Tool
 * Renders issue list outputs for both structured and semantic issue queries
 */
function IssueListTool({ part, toolName }: ToolComponentProps & { toolName: 'getIssues' | 'semanticSearchIssues' }) {
  const output = 'output' in part ? (part.output as GetIssuesOutput) : null
  const issues = output?.issues ?? []
  const total = output?.total ?? 0
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Convert issues to rows
  const rows = issues.map(issue => convertIssueToRow(issue))

  // Define visible columns (Status, Priority, Title, Assignee)
  const visibleColumns = useMemo<PropertyMeta[]>(
    () => [
      {
        core: { propertyId: SystemPropertyId.STATUS, type: 'string' },
        display: { label: 'Status' },
        table: { layout: PropertyTableColumnLayout.LEFT, defaultVisible: true },
      },
      {
        core: { propertyId: SystemPropertyId.PRIORITY, type: 'string' },
        display: { label: 'Priority' },
        table: { layout: PropertyTableColumnLayout.LEFT, defaultVisible: true },
      },
      {
        core: { propertyId: SystemPropertyId.TITLE, type: 'string' },
        display: { label: 'Title' },
        table: { layout: PropertyTableColumnLayout.FILL, defaultVisible: true },
      },
      {
        core: { propertyId: SystemPropertyId.ASSIGNEE, type: 'string' },
        display: { label: 'Assignee' },
        table: { layout: PropertyTableColumnLayout.RIGHT, defaultVisible: true },
      },
    ],
    [],
  )

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = toolName === 'getIssues' ? 'Get Issues' : 'Semantic Search Issues'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = toolName === 'getIssues' ? 'Getting issues...' : 'Searching issues...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = total === 0 ? 'No issues found' : `Found ${total} issue${total !== 1 ? 's' : ''}`
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to get issues'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <Collapsible defaultOpen={true} className="not-prose group mb-4 w-full rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in space-y-4 p-4 pt-0 outline-none',
        )}>
        {isSuccess ? (
          rows.length === 0 ? (
            <div className="text-muted-foreground text-sm">No issues found</div>
          ) : (
            <div className="overflow-hidden rounded-sm border">
              <div className="flex flex-col divide-y">
                {rows.map(row => (
                  <IssueTableRow key={row.id} row={{ ...row, _id: row.id }} metas={visibleColumns} />
                ))}
              </div>
            </div>
          )
        ) : isError ? (
          <div className="text-destructive text-sm">{errorText || 'Failed to get issues'}</div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Get Issues Tool
 * Gets a list of issues with optional filtering
 */
export function GetIssuesTool({ part }: ToolComponentProps): JSX.Element {
  return <IssueListTool part={part} toolName="getIssues" />
}

/**
 * Semantic Search Issues Tool
 * Gets issues ranked by semantic relevance on title and rich text fields
 */
export function SemanticSearchIssuesTool({ part }: ToolComponentProps): JSX.Element {
  return <IssueListTool part={part} toolName="semanticSearchIssues" />
}

/**
 * Get Issue By ID Tool
 * Gets detailed information about a specific issue
 */
export function GetIssueByIdTool({ part }: ToolComponentProps): JSX.Element {
  const output = 'output' in part ? (part.output as { issueId?: number }) : null
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = 'Get Issue Details'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Getting issue details...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = 'Issue details retrieved'
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to get issue details'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <Collapsible defaultOpen={true} className="not-prose group mb-4 w-full rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in space-y-4 p-4 pt-0 outline-none',
        )}>
        {isSuccess && output?.issueId ? (
          <div className="text-muted-foreground text-sm">Issue #{output.issueId}</div>
        ) : isError ? (
          <div className="text-destructive text-sm">{errorText || 'Failed to get issue details'}</div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Update Issue Tool
 * Updates an existing issue with new property values
 */
export function UpdateIssueTool({ part }: ToolComponentProps): JSX.Element {
  const { properties } = useServerProperties()

  return <UpdateIssueToolView part={part} properties={properties ?? []} />
}

type UpdateIssueToolViewProps = ToolComponentProps & {
  properties: Array<{ id: string; name: string }>
}

export function UpdateIssueToolView({ part, properties }: UpdateIssueToolViewProps): JSX.Element {
  const output = 'output' in part ? (part.output as UpdateIssueOutput) : null
  const issueId = output?.issueId
  const success = output?.success
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Get updated properties from input
  const input = 'input' in part ? (part.input as UpdateIssueInput) : null
  const operations = input?.operations ?? []

  // Build property ID to name map from API data
  const propertyNames = useMemo(() => {
    const map: Record<string, string> = {}
    properties?.forEach(prop => {
      map[prop.id] = prop.name
    })
    return map
  }, [properties])

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available' && success === true
  const isError = part.state === 'output-error' || (part.state === 'output-available' && success === false)

  // State-based title and icon
  let title = 'Update Issue'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Updating issue...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = 'Issue updated'
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to update issue'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  const handleClick = () => {
    if (issueId) {
      window.open(`/issues/${issueId}`, '_blank')
    }
  }

  return (
    <Collapsible defaultOpen={true} className="not-prose group mb-4 w-full rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in space-y-4 p-4 pt-0 outline-none',
        )}>
        {isSuccess && issueId ? (
          <div className="space-y-3">
            {operations.length > 0 && (
              <div className="space-y-1">
                {operations.map((op, index) => (
                  <div key={index} className="text-muted-foreground text-sm">
                    <span className="font-medium">{propertyNames[op.propertyId] || op.propertyId}</span>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleClick}
              className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left font-normal">
              <span className="flex items-center gap-2 overflow-hidden">
                <span className="text-muted-foreground text-sm font-medium">#{issueId}</span>
                <span className="truncate text-sm font-medium">View Issue</span>
              </span>
              <span className="text-muted-foreground shrink-0 text-sm">→</span>
            </Button>
          </div>
        ) : isError ? (
          <div className="text-destructive text-sm">{errorText || 'Failed to update issue'}</div>
        ) : isRunning && operations.length > 0 ? (
          <div className="space-y-1">
            {operations.map((op, index) => (
              <div key={index} className="text-muted-foreground text-sm">
                <span className="font-medium">{propertyNames[op.propertyId] || op.propertyId}</span>
              </div>
            ))}
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Delete Issue Tool
 * Deletes an issue by its ID
 */
export function DeleteIssueTool({ part }: ToolComponentProps): JSX.Element {
  const input = 'input' in part ? (part.input as DeleteIssueInput) : null
  const output = 'output' in part ? (part.output as DeleteIssueOutput) : null
  const errorText = 'errorText' in part ? part.errorText : undefined

  const issueId = output?.issueId ?? input?.issueId
  const success = output?.success

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available' && success === true
  const isError = part.state === 'output-error' || (part.state === 'output-available' && success === false)

  // State-based title and icon
  let title = 'Delete Issue'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Deleting issue...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = 'Issue deleted'
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to delete issue'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  const handleInputIssueClick = () => {
    if (input?.issueId) {
      window.open(`/issues/${input.issueId}`, '_blank')
    }
  }

  return (
    <Collapsible defaultOpen={true} className="not-prose group mb-4 w-full rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in space-y-4 p-4 pt-0 outline-none',
        )}>
        {isSuccess && issueId ? (
          <div className="text-muted-foreground text-sm font-medium">#{issueId}</div>
        ) : isError ? (
          <div className="text-destructive text-sm">{errorText || 'Failed to delete issue'}</div>
        ) : isRunning && input?.issueId ? (
          <Button
            variant="outline"
            onClick={handleInputIssueClick}
            className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left font-normal">
            <span className="flex items-center gap-2 overflow-hidden">
              <span className="text-muted-foreground text-sm font-medium">#{input.issueId}</span>
              <span className="truncate text-sm font-medium">View Issue</span>
            </span>
            <span className="text-muted-foreground shrink-0 text-sm">→</span>
          </Button>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Get Comments Tool
 * Gets all comments for a specific issue
 */
export function GetCommentsTool({ part }: ToolComponentProps): JSX.Element {
  const output = 'output' in part ? (part.output as { comments?: Array<{ id: string; content: string }> }) : null
  const comments = output?.comments ?? []
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = 'Get Comments'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Getting comments...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = comments.length === 0 ? 'No comments' : `${comments.length} comment${comments.length !== 1 ? 's' : ''}`
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to get comments'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <div className="not-prose mb-4 flex w-full items-center gap-2 rounded-md border p-3">
      {icon}
      <span className="text-sm font-medium">{title}</span>
      {isError && errorText ? <span className="text-destructive ml-2 text-sm">{errorText}</span> : null}
    </div>
  )
}

/**
 * Create Comment Tool
 * Creates a new comment on an issue
 */
export function CreateCommentTool({ part }: ToolComponentProps): JSX.Element {
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = 'Create Comment'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Creating comment...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = 'Comment created'
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to create comment'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <div className="not-prose mb-4 flex w-full items-center gap-2 rounded-md border p-3">
      {icon}
      <span className="text-sm font-medium">{title}</span>
      {isError && errorText ? <span className="text-destructive ml-2 text-sm">{errorText}</span> : null}
    </div>
  )
}

/**
 * Update Comment Tool
 * Updates an existing comment
 */
export function UpdateCommentTool({ part }: ToolComponentProps): JSX.Element {
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = 'Update Comment'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Updating comment...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = 'Comment updated'
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to update comment'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <div className="not-prose mb-4 flex w-full items-center gap-2 rounded-md border p-3">
      {icon}
      <span className="text-sm font-medium">{title}</span>
      {isError && errorText ? <span className="text-destructive ml-2 text-sm">{errorText}</span> : null}
    </div>
  )
}

/**
 * Delete Comment Tool
 * Deletes a comment
 */
export function DeleteCommentTool({ part }: ToolComponentProps): JSX.Element {
  const output = 'output' in part ? (part.output as { success?: boolean; commentId?: string }) : null
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available' && output?.success === true
  const isError = part.state === 'output-error' || (part.state === 'output-available' && output?.success === false)

  // State-based title and icon
  let title = 'Delete Comment'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Deleting comment...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = 'Comment deleted'
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to delete comment'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <div className="not-prose mb-4 flex w-full items-center gap-2 rounded-md border p-3">
      {icon}
      <span className="text-sm font-medium">{title}</span>
      {isError && errorText ? <span className="text-destructive ml-2 text-sm">{errorText}</span> : null}
    </div>
  )
}

/**
 * Get Subscribers Tool
 * Gets all subscribers for a specific issue
 */
export function GetSubscribersTool({ part }: ToolComponentProps): JSX.Element {
  const output = 'output' in part ? (part.output as { subscriberIds?: string[] }) : null
  const subscriberIds = output?.subscriberIds ?? []
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available'
  const isError = part.state === 'output-error'

  // State-based title and icon
  let title = 'Get Subscribers'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Getting subscribers...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title =
      subscriberIds.length === 0
        ? 'No subscribers'
        : `${subscriberIds.length} subscriber${subscriberIds.length !== 1 ? 's' : ''}`
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to get subscribers'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <div className="not-prose mb-4 flex w-full items-center gap-2 rounded-md border p-3">
      {icon}
      <span className="text-sm font-medium">{title}</span>
      {isError && errorText ? <span className="text-destructive ml-2 text-sm">{errorText}</span> : null}
    </div>
  )
}

/**
 * Add Subscriber Tool
 * Adds subscribers to an issue
 */
export function AddSubscriberTool({ part }: ToolComponentProps): JSX.Element {
  const output = 'output' in part ? (part.output as { success?: boolean }) : null
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available' && output?.success === true
  const isError = part.state === 'output-error' || (part.state === 'output-available' && output?.success === false)

  // State-based title and icon
  let title = 'Add Subscriber'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Adding subscriber...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = 'Subscriber added'
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to add subscriber'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <div className="not-prose mb-4 flex w-full items-center gap-2 rounded-md border p-3">
      {icon}
      <span className="text-sm font-medium">{title}</span>
      {isError && errorText ? <span className="text-destructive ml-2 text-sm">{errorText}</span> : null}
    </div>
  )
}

/**
 * Remove Subscriber Tool
 * Removes subscribers from an issue
 */
export function RemoveSubscriberTool({ part }: ToolComponentProps): JSX.Element {
  const output = 'output' in part ? (part.output as { success?: boolean }) : null
  const errorText = 'errorText' in part ? part.errorText : undefined

  // Determine state-based content
  const isRunning = part.state === 'input-available' || part.state === 'input-streaming'
  const isSuccess = part.state === 'output-available' && output?.success === true
  const isError = part.state === 'output-error' || (part.state === 'output-available' && output?.success === false)

  // State-based title and icon
  let title = 'Remove Subscriber'
  let icon: React.ReactNode = <ClockIcon className="text-muted-foreground size-4" />

  if (isRunning) {
    title = 'Removing subscriber...'
    icon = <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
  } else if (isSuccess) {
    title = 'Subscriber removed'
    icon = <CheckCircleIcon className="size-4 text-green-600" />
  } else if (isError) {
    title = 'Failed to remove subscriber'
    icon = <XCircleIcon className="size-4 text-red-600" />
  }

  return (
    <div className="not-prose mb-4 flex w-full items-center gap-2 rounded-md border p-3">
      {icon}
      <span className="text-sm font-medium">{title}</span>
      {isError && errorText ? <span className="text-destructive ml-2 text-sm">{errorText}</span> : null}
    </div>
  )
}
