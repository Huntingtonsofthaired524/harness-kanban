import { ActivityRendererComponent } from '@/issue/registry/activity-behavior-registry'
import { ActivityType } from '@repo/shared/issue/constants'
import { ClearPropertyValueActivityPayload } from '@repo/shared/issue/types'
import { ActivityItemLayout } from '../activity-item-layout'

export const UnassignedActivityItem: ActivityRendererComponent = ({ activity }) => {
  if (activity.type !== ActivityType.CLEAR_PROPERTY_VALUE) return null

  const p = activity.payload as ClearPropertyValueActivityPayload

  return (
    <ActivityItemLayout activity={activity}>
      <span>unassigned</span>
      <span className="font-medium">{p.propertyName}</span>
    </ActivityItemLayout>
  )
}
