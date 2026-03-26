import { SelectorActivityItem } from '@/issue/components/activity/renderers/selector-activity-item'
import { StatusActivityItem } from '@/issue/components/activity/renderers/status-activity-item'
import { UnassignedActivityItem } from '@/issue/components/activity/renderers/unassigned-activity-item'
import { UserActivityItem } from '@/issue/components/activity/renderers/user-activity-item'
import { registerActivityBehavior } from '@/issue/registry/activity-behavior-registry'
import { ActivityType } from '@repo/shared/issue/constants'
import { SystemPropertyId } from '@repo/shared/property/constants'

registerActivityBehavior(SystemPropertyId.TITLE, {
  shouldDisplay: () => false,
})

registerActivityBehavior(SystemPropertyId.DESCRIPTION, {
  shouldDisplay: () => false,
})

registerActivityBehavior(SystemPropertyId.ASSIGNEE, {
  shouldDisplay: activity =>
    activity.type === ActivityType.CLEAR_PROPERTY_VALUE || activity.type === ActivityType.SET_PROPERTY_VALUE,
  renderer: ({ activity }) => {
    if (activity.type === ActivityType.CLEAR_PROPERTY_VALUE) {
      return <UnassignedActivityItem activity={activity} />
    }
    return <UserActivityItem activity={activity} />
  },
})

registerActivityBehavior(SystemPropertyId.STATUS, {
  shouldDisplay: () => true,
  renderer: StatusActivityItem,
})

registerActivityBehavior(SystemPropertyId.PRIORITY, {
  shouldDisplay: () => true,
  renderer: SelectorActivityItem,
})
