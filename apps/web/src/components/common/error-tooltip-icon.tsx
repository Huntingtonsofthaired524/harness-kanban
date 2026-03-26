'use client'

import { AlertCircle } from 'lucide-react'
import React from 'react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ErrorTooltipIconProps {
  message?: string
  className?: string
}

export const ErrorTooltipIcon: React.FC<ErrorTooltipIconProps> = ({ message, className }) => {
  if (!message) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertCircle className={`h-4 w-4 text-red-500 ${className ?? ''}`} />
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-sm">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
