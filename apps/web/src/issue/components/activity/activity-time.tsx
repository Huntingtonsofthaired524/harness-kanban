import React from 'react'

import { formatDisplayDetailDate } from '@repo/shared/lib/utils/datetime'

interface ActivityTimeProps {
  createdAt: number
}

export const ActivityTime: React.FC<ActivityTimeProps> = ({ createdAt }) => {
  return <span className="text-muted-foreground whitespace-nowrap text-xs">{formatDisplayDetailDate(createdAt)}</span>
}
