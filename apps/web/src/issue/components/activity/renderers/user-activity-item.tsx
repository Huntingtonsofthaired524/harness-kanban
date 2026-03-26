import React from 'react'

import { UserDisplay } from '@/components/common/user-display'
import { ActivityRendererComponent } from '@/issue/registry/activity-behavior-registry'
import { ActivityType } from '@repo/shared/issue/constants'
import { SetPropertyValueActivityPayload } from '@repo/shared/issue/types'
import { ActivityItemLayout } from '../activity-item-layout'
import { ActivityOperation } from '../activity-operation'

export const UserActivityItem: ActivityRendererComponent = ({ activity }) => {
  if (activity.type !== ActivityType.SET_PROPERTY_VALUE) return null

  const p = activity.payload as SetPropertyValueActivityPayload

  let valueDisplay: React.ReactNode
  if (!p.newValue || typeof p.newValue !== 'string') {
    valueDisplay = <span className="text-muted-foreground italic">unknown</span>
  } else {
    valueDisplay = <UserDisplay userId={p.newValue} />
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
