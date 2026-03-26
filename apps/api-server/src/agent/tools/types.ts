import type { ActivityService } from '@/issue/activity.service'
import type { CommentService } from '@/issue/comment.service'
import type { IssueService } from '@/issue/issue.service'
import type { PropertyService } from '@/property/property.service'
import type { UserService } from '@/user/user.service'
import type { AgentService } from '../agent.service'

export interface AgentToolsContext {
  propertyService: PropertyService
  issueService: IssueService
  userService: UserService
  commentService: CommentService
  activityService: ActivityService
  agentService: AgentService
  workspaceId: string
  userId: string
  chatId: string
}
