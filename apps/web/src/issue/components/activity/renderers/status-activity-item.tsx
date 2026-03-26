'use client'

import { ActivityRendererComponent } from '@/issue/registry/activity-behavior-registry'
import { StatusIcon } from '@/property/components/fields/status/status-utils'
import { useServerProperties } from '@/property/hooks/use-properties'
import { ActivityType } from '@repo/shared/issue/constants'
import { SetPropertyValueActivityPayload } from '@repo/shared/issue/types'
import { findStatusDefinition, getStatusPropertyConfig } from '@repo/shared/property/status-config'
import { ActivityItemLayout } from '../activity-item-layout'
import { ActivityOperation } from '../activity-operation'

export const StatusActivityItem: ActivityRendererComponent = ({ activity }) => {
  const { properties = [] } = useServerProperties()

  if (activity.type !== ActivityType.SET_PROPERTY_VALUE) {
    return null
  }

  const payload = activity.payload as SetPropertyValueActivityPayload
  const property = properties.find(item => item.id === payload.propertyId)
  const config = property ? getStatusPropertyConfig(property) : null
  const status = config ? findStatusDefinition(config, payload.newValue as string | undefined) : null

  return (
    <ActivityItemLayout activity={activity}>
      <ActivityOperation type={activity.type} />
      <span className="font-medium">{payload.propertyName}</span>
      <span> to </span>
      <span className="inline-flex items-center gap-1">
        <StatusIcon iconName={status?.icon} statusId={status?.id} className="size-4" />
        <span>{status?.label ?? String(payload.newValue ?? '-')}</span>
      </span>
    </ActivityItemLayout>
  )
}
