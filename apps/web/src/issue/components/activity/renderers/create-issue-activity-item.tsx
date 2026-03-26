import { ActivityOperation } from '@/issue/components/activity/activity-operation'
import { ActivityRendererComponent } from '@/issue/registry/activity-behavior-registry'
import { ActivityType } from '@repo/shared'
import { ActivityItemLayout } from '../activity-item-layout'

export const CreateIssueActivityItem: ActivityRendererComponent = ({ activity }) => {
  if (activity.type !== ActivityType.CREATE_ISSUE) return null

  return (
    <ActivityItemLayout activity={activity}>
      <ActivityOperation type={activity.type} />
    </ActivityItemLayout>
  )
}
