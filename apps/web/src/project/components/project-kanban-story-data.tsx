import { GeometricUserAvatar } from '@/components/common/geometric-user-avatar'
import { SvgIcon } from '@/components/common/svg-icon'
import type { ProjectKanbanCardData, ProjectKanbanColumnData } from '@/project/components/project-kanban-utils'
import type { PropertyOptionItem } from '@/property/types/property-types'

const priorityIcon = (src: string, alt: string) => (
  <SvgIcon src={src} alt={alt} width={16} height={16} className="dark:invert" />
)

const assigneeAvatar = (id: string, username: string) => (
  <GeometricUserAvatar
    user={{
      id,
      username,
      imageUrl: '',
    }}
    size={16}
    className="h-4 w-4"
  />
)

export const samplePriorityOptions: PropertyOptionItem[] = [
  {
    value: 'no-priority',
    label: 'No Priority',
    icon: priorityIcon('/images/priority-none.svg', 'No Priority'),
  },
  {
    value: 'low',
    label: 'Low',
    icon: priorityIcon('/images/priority-low.svg', 'Low Priority'),
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: priorityIcon('/images/priority-medium.svg', 'Medium Priority'),
  },
  {
    value: 'high',
    label: 'High',
    icon: priorityIcon('/images/priority-high.svg', 'High Priority'),
  },
  {
    value: 'urgent',
    label: 'Urgent',
    icon: priorityIcon('/images/priority-urgent.svg', 'Urgent Priority'),
  },
]

export const sampleAssigneeOptions: PropertyOptionItem[] = [
  {
    value: 'user-1',
    label: 'Alice',
    icon: assigneeAvatar('user-1', 'Alice'),
  },
  {
    value: 'user-2',
    label: 'Bob',
    icon: assigneeAvatar('user-2', 'Bob'),
  },
  {
    value: 'user-3',
    label: 'Charlie',
    icon: assigneeAvatar('user-3', 'Charlie'),
  },
]

export const sampleKanbanCard: ProjectKanbanCardData = {
  assigneeValue: 'user-1',
  issueId: 101,
  title: 'Build a proper project board for issue flow management',
  href: '/issues/101?issueSource=project&issueProjectId=project-1',
  priority: {
    label: 'High',
    icon: priorityIcon('/images/priority-high.svg', 'High Priority'),
  },
  priorityValue: 'high',
  statusId: 'todo',
  assignee: {
    label: 'Alice',
    icon: assigneeAvatar('user-1', 'Alice'),
  },
}

export const sampleKanbanColumns: ProjectKanbanColumnData[] = [
  {
    statusId: 'todo',
    label: 'Todo',
    iconName: 'Circle',
    cards: [
      sampleKanbanCard,
      {
        assigneeValue: null,
        issueId: 102,
        title: 'Map status config into ordered Kanban columns',
        href: '/issues/102?issueSource=project&issueProjectId=project-1',
        priority: {
          label: 'Medium',
          icon: priorityIcon('/images/priority-medium.svg', 'Medium Priority'),
        },
        priorityValue: 'medium',
        statusId: 'todo',
        assignee: null,
      },
    ],
  },
  {
    statusId: 'in_progress',
    label: 'In progress',
    iconName: 'Hammer',
    cards: [
      {
        assigneeValue: 'user-2',
        issueId: 103,
        title: 'Wire drag and drop to the issue status update API',
        href: '/issues/103?issueSource=project&issueProjectId=project-1',
        priority: {
          label: 'Urgent',
          icon: priorityIcon('/images/priority-urgent.svg', 'Urgent Priority'),
        },
        priorityValue: 'urgent',
        statusId: 'in_progress',
        assignee: {
          label: 'Bob',
          icon: assigneeAvatar('user-2', 'Bob'),
        },
      },
    ],
  },
  {
    statusId: 'in_review',
    label: 'In review',
    iconName: 'GitPullRequest',
    cards: [
      {
        assigneeValue: 'user-3',
        issueId: 104,
        title: 'Validate board rollback when the backend rejects a drop',
        href: '/issues/104?issueSource=project&issueProjectId=project-1',
        priority: {
          label: 'Low',
          icon: priorityIcon('/images/priority-low.svg', 'Low Priority'),
        },
        priorityValue: 'low',
        statusId: 'in_review',
        assignee: {
          label: 'Charlie',
          icon: assigneeAvatar('user-3', 'Charlie'),
        },
      },
    ],
  },
  {
    statusId: 'completed',
    label: 'Completed',
    iconName: 'BadgeCheck',
    cards: [],
  },
]

export const denseKanbanColumns: ProjectKanbanColumnData[] = [
  {
    statusId: 'todo',
    label: 'Todo',
    iconName: 'Circle',
    cards: Array.from({ length: 9 }, (_, index) => ({
      assigneeValue: index % 2 === 0 ? 'user-1' : 'user-2',
      issueId: 200 + index,
      title: `Dense column issue ${index + 1}`,
      href: `/issues/${200 + index}`,
      priority: {
        label: index % 2 === 0 ? 'Medium' : 'High',
        icon: priorityIcon(index % 2 === 0 ? '/images/priority-medium.svg' : '/images/priority-high.svg', 'Priority'),
      },
      priorityValue: index % 2 === 0 ? 'medium' : 'high',
      statusId: 'todo',
      assignee: {
        label: index % 2 === 0 ? 'Alice' : 'Bob',
        icon: assigneeAvatar(index % 2 === 0 ? 'user-1' : 'user-2', index % 2 === 0 ? 'Alice' : 'Bob'),
      },
    })),
  },
  {
    statusId: 'in_progress',
    label: 'In progress',
    iconName: 'Hammer',
    cards: [],
  },
  {
    statusId: 'completed',
    label: 'Completed',
    iconName: 'BadgeCheck',
    cards: [
      {
        assigneeValue: 'user-1',
        issueId: 250,
        title: 'Ship the first board iteration',
        href: '/issues/250',
        priority: {
          label: 'High',
          icon: priorityIcon('/images/priority-high.svg', 'High Priority'),
        },
        priorityValue: 'high',
        statusId: 'completed',
        assignee: {
          label: 'Alice',
          icon: assigneeAvatar('user-1', 'Alice'),
        },
      },
    ],
  },
]
