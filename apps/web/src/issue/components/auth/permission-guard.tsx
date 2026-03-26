'use client'

import React from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface PermissionGuardProps {
  permissions?: string[]
  requireAnyPermission?: boolean
  tooltipMessage?: string
  children: React.ReactNode
}

/**
 * 1. If the user has the required permissions, the children will be rendered
 * 2. If the user does not have the required permissions, the children will be rendered with disabled properties
 */
export const PermissionGuard = ({
  permissions = [],
  tooltipMessage = 'You need to have the member role permission to perform this action.',
  children,
}: PermissionGuardProps) => {
  // const hasAccess = permissions.length === 0 || (isLoaded && permissions.some(permission => has({ permission })))
  const hasAccess = true

  // Determine which tooltip message to show based on mode
  let effectiveTooltipMessage = tooltipMessage
  if (permissions.length > 0 && !hasAccess) {
    effectiveTooltipMessage = 'Oops, you need admin or higher permissions to do this.'
  } else if (!hasAccess) {
    effectiveTooltipMessage = "Hmm, you're not allowed to do this at the moment."
  }

  if (!hasAccess && React.isValidElement(children)) {
    // Clone child component and add disabled properties
    const disabledChild = React.cloneElement(children, {
      ...children.props,
      disabled: true,
      onClick: undefined,
      onMouseDown: undefined,
      onMouseUp: undefined,
      onKeyDown: undefined,
      onKeyUp: undefined,
      style: {
        ...children.props.style,
        opacity: 0.5,
        cursor: 'not-allowed',
      },
      className: `${children.props.className || ''} pointer-events-none opacity-50`.trim(),
    })

    // Wrap with tooltip
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="inline-block">{disabledChild}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{effectiveTooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return <>{children}</>
}

/**
 * Component specifically for permission checking, based on management permissions
 */
export const ManagePermissionGuard = React.forwardRef<
  HTMLElement,
  {
    children: React.ReactNode
    permissions?: string[]
    requireAnyPermission?: boolean
    tooltipMessage?: string
  }
>(({ children, permissions, requireAnyPermission = true, tooltipMessage }, _ref) => {
  const effectivePermissions = permissions || []

  return (
    <PermissionGuard
      permissions={effectivePermissions}
      requireAnyPermission={requireAnyPermission}
      tooltipMessage={tooltipMessage}>
      {children}
    </PermissionGuard>
  )
})

ManagePermissionGuard.displayName = 'ManagePermissionGuard'
PermissionGuard.displayName = 'PermissionGuard'
