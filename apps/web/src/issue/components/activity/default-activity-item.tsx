import React from 'react'

import { Activity } from '@repo/shared/issue/types'
import { ActivityItemLayout } from './activity-item-layout'
import { ActivityOperation } from './activity-operation'
import { ActivityPayload } from './activity-payload'

interface DefaultActivityItemProps {
  activity: Activity
}

export const DefaultActivityItem: React.FC<DefaultActivityItemProps> = ({ activity }) => {
  return (
    <ActivityItemLayout activity={activity}>
      <ActivityOperation type={activity.type} />
      <ActivityPayload activity={activity} />
    </ActivityItemLayout>
  )
}
