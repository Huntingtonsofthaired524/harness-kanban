import React from 'react'

import { getActivityBehavior } from '@/issue/registry/activity-behavior-registry'
import { ActivityType } from '@repo/shared/issue/constants'
import { Activity, ClearPropertyValueActivityPayload, SetPropertyValueActivityPayload } from '@repo/shared/issue/types'
import { DefaultPropertyValue } from './payloads/default-value'

interface ActivityPayloadProps {
  activity: Activity
}

export const ActivityPayload: React.FC<ActivityPayloadProps> = ({ activity }) => {
  if (activity.type === ActivityType.SET_PROPERTY_VALUE) {
    const p = activity.payload as SetPropertyValueActivityPayload
    const behavior = getActivityBehavior(p.propertyId)

    const customValue = behavior?.renderer?.({ activity })
    if (customValue) {
      return (
        <>
          <span className="text-muted-foreground font-medium">{p.propertyName}</span>
          <span className="text-muted-foreground"> to </span>
          {customValue}
        </>
      )
    }

    return (
      <>
        <span className="text-muted-foreground font-medium">{p.propertyName}</span>
        <span className="text-muted-foreground"> to </span>
        <DefaultPropertyValue activity={activity} />
      </>
    )
  }

  if (activity.type === ActivityType.CLEAR_PROPERTY_VALUE) {
    const p = activity.payload as ClearPropertyValueActivityPayload
    const behavior = getActivityBehavior(p.propertyId)
    const customValue = behavior?.renderer?.({ activity })

    return customValue ?? <span className="text-muted-foreground">{p.propertyName}</span>
  }

  return null
}
