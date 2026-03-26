import React, { cloneElement, useEffect, useState } from 'react'

import { ActivityRendererComponent } from '@/issue/registry/activity-behavior-registry'
import { getPropertyRendererEntry } from '@/property/registry/property-registry'
import { PropertyOptionItem } from '@/property/types/property-types'
import { ActivityType } from '@repo/shared/issue/constants'
import { SetPropertyValueActivityPayload } from '@repo/shared/issue/types'
import { ActivityItemLayout } from '../activity-item-layout'
import { ActivityOperation } from '../activity-operation'

export const SelectorActivityItem: ActivityRendererComponent = ({ activity }) => {
  const p = activity.payload as SetPropertyValueActivityPayload
  const entry = getPropertyRendererEntry(p.propertyId)
  const [options, setOptions] = useState<PropertyOptionItem[]>([])

  const matched = options.find(opt => opt.value === p.newValue)

  useEffect(() => {
    const loader = entry?.optionsLoader
    if (!loader) return

    const result = loader()
    if (Array.isArray(result)) {
      setOptions(result)
    } else {
      result.then(setOptions)
    }
  }, [entry])

  if (activity.type !== ActivityType.SET_PROPERTY_VALUE) return null

  let valueDisplay: React.ReactNode
  if (!matched) {
    valueDisplay = <span className="text-muted-foreground italic">{String(p.newValue ?? '-')}</span>
  } else {
    valueDisplay = (
      <span className="text-foreground inline-flex items-center gap-1">
        {matched.icon && (
          <span className="inline-flex h-4 w-4 items-center justify-center">
            {cloneElement(matched.icon as React.ReactElement, {
              className: 'h-4 w-4',
            })}
          </span>
        )}
        <span>{matched.label}</span>
      </span>
    )
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
