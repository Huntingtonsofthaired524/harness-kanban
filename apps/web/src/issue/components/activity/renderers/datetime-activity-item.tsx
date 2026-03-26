import React from 'react'

import { ActivityRendererComponent } from '@/issue/registry/activity-behavior-registry'
import { ActivityType } from '@repo/shared/issue/constants'
import { SetPropertyValueActivityPayload } from '@repo/shared/issue/types'
import { formatDisplayDate } from '@repo/shared/lib/utils/datetime'
import { ActivityItemLayout } from '../activity-item-layout'
import { ActivityOperation } from '../activity-operation'

export const DatetimeActivityItem: ActivityRendererComponent = ({ activity }) => {
  if (activity.type !== ActivityType.SET_PROPERTY_VALUE) return null

  const p = activity.payload as SetPropertyValueActivityPayload
  const val = p.newValue

  let valueDisplay: React.ReactNode
  if (typeof val !== 'number') {
    valueDisplay = <span className="text-muted-foreground italic">Invalid</span>
  } else {
    valueDisplay = <span className="text-foreground">{formatDisplayDate(val)}</span>
  }

  return (
    <ActivityItemLayout activity={activity}>
      <ActivityOperation type={activity.type} />
      <span className="font-medium">{p.propertyName}</span>
      <span> to </span>
      {valueDisplay}
    </ActivityItemLayout>
  )
}
