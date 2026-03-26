import React from 'react'

import { ActivityType } from '@repo/shared/issue/constants'

interface ActivityOperationProps {
  type: string
}

export const ActivityOperation: React.FC<ActivityOperationProps> = ({ type }) => {
  let text = ''

  switch (type) {
    case ActivityType.CREATE_ISSUE:
      text = 'created issue'
      break
    case ActivityType.SET_PROPERTY_VALUE:
      text = 'changed'
      break
    case ActivityType.CLEAR_PROPERTY_VALUE:
      text = 'cleared'
      break
  }

  return <span className="text-muted-foreground">{text}</span>
}
