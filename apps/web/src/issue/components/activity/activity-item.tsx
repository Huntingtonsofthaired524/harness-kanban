import React from 'react'

import { CreateIssueActivityItem } from '@/issue/components/activity/renderers/create-issue-activity-item'
import { getActivityBehavior } from '@/issue/registry/activity-behavior-registry'
import { ActivityType } from '@repo/shared/issue/constants'
import { Activity, Comment, SetPropertyValueActivityPayload } from '@repo/shared/issue/types'
import { CommentItem } from '../comment/comment-item'

interface ActivityItemProps {
  activity: Activity
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  if (activity.type === ActivityType.CREATE_ISSUE) {
    return <CreateIssueActivityItem activity={activity} />
  }

  if (activity.type === ActivityType.COMMENT) {
    return <CommentItem comment={activity.payload as Comment} />
  }

  const p = activity.payload as SetPropertyValueActivityPayload
  const behavior = getActivityBehavior(p.propertyId)

  // If has custom renderer, use it to render the entire activity
  if (behavior?.renderer) {
    return <behavior.renderer activity={activity} />
  }

  // Default fallback for other activity types
  return null
}
