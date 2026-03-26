import { ToolApprovalProvider } from '../tool-approval-context'
import { FallbackTool } from './fallback-tool'
import {
  AddMultipleTodosTool,
  AddSubscriberTool,
  CreateCommentTool,
  CreateIssueTool,
  DeleteCommentTool,
  DeleteIssueTool,
  DeleteMultipleTodosTool,
  GetAvailableUsersTool,
  GetCommentsTool,
  GetCurrentUserTool,
  GetIssueByIdTool,
  GetIssuesTool,
  GetSubscribersTool,
  ListTodosTool,
  QueryPropertiesTool,
  RemoveSubscriberTool,
  ToggleMultipleTodosTool,
  UpdateCommentTool,
  UpdateIssueTool,
} from './tool-components'
import { renderToolPart } from './tool-registry'
import type { Meta, StoryObj } from '@storybook/react'
import type { ToolUIPart } from 'ai'

// Common type for tool stories
interface ToolStoryArgs {
  state: ToolUIPart['state']
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  errorText?: string
}

// Helper to create a typed tool part from args
const createToolPart = (toolName: string, args: ToolStoryArgs): ToolUIPart => {
  const base = {
    type: `tool-${toolName}` as const,
    toolCallId: `call-${Math.random().toString(36).slice(2)}`,
    state: args.state,
    ...(args.input && { input: args.input }),
    ...(args.output && { output: args.output }),
    ...(args.errorText && { errorText: args.errorText }),
  }
  return base as unknown as ToolUIPart
}

const meta: Meta = {
  title: 'Agent/ToolRenderers',
}

export default meta

// Create Issue Tool - Shows all states (running, completed, error)
type CreateIssueStory = StoryObj<typeof CreateIssueTool>

export const CreateIssueRunning: CreateIssueStory = {
  args: {
    part: createToolPart('createIssue', {
      state: 'input-available',
      input: {
        issues: [
          {
            propertyValues: [
              { propertyId: 'property0002', value: 'Server Outage' },
              { propertyId: 'property0007', value: 'high' },
            ],
          },
        ],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <CreateIssueTool part={args.part} />,
}

export const CreateIssueCompleted: CreateIssueStory = {
  args: {
    part: createToolPart('createIssue', {
      state: 'output-available',
      input: {
        issues: [
          {
            propertyValues: [
              { propertyId: 'property0002', value: 'Server Outage' },
              { propertyId: 'property0007', value: 'high' },
            ],
          },
        ],
      },
      output: {
        results: [
          {
            issueId: 123,
            success: true,
          },
        ],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <CreateIssueTool part={args.part} />,
}

export const CreateIssueError: CreateIssueStory = {
  args: {
    part: createToolPart('createIssue', {
      state: 'output-error',
      input: {
        issues: [
          {
            propertyValues: [{ propertyId: 'prop-1', value: '' }],
          },
        ],
      },
      errorText: 'Invalid property value: Title is required',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <CreateIssueTool part={args.part} />,
}

type UpdateIssueStory = StoryObj<typeof UpdateIssueTool>

export const UpdateIssueRunning: UpdateIssueStory = {
  args: {
    part: createToolPart('updateIssue', {
      state: 'input-available',
      input: {
        issueId: 123,
        operations: [
          { propertyId: 'property0003', operationType: 'set', operationPayload: { value: 'in_review' } },
          { propertyId: 'property0007', operationType: 'set', operationPayload: { value: 'low' } },
        ],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <UpdateIssueTool part={args.part} />,
}

export const UpdateIssueCompleted: UpdateIssueStory = {
  args: {
    part: createToolPart('updateIssue', {
      state: 'output-available',
      input: {
        issueId: 123,
        operations: [
          { propertyId: 'property0003', operationType: 'set', operationPayload: { value: 'in_review' } },
          { propertyId: 'property0007', operationType: 'set', operationPayload: { value: 'low' } },
        ],
      },
      output: {
        success: true,
        issueId: 123,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <UpdateIssueTool part={args.part} />,
}

export const UpdateIssueError: UpdateIssueStory = {
  args: {
    part: createToolPart('updateIssue', {
      state: 'output-available',
      input: {
        issueId: 123,
        operations: [{ propertyId: 'property0003', operationType: 'set', operationPayload: { value: 'invalid' } }],
      },
      output: {
        success: false,
        issueId: 123,
        errors: ['Invalid status value'],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <UpdateIssueTool part={args.part} />,
}

type DeleteIssueStory = StoryObj<typeof DeleteIssueTool>

export const DeleteIssueRunning: DeleteIssueStory = {
  args: {
    part: createToolPart('deleteIssue', {
      state: 'input-available',
      input: {
        issueId: 123,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <DeleteIssueTool part={args.part} />,
}

export const DeleteIssueError: DeleteIssueStory = {
  args: {
    part: createToolPart('deleteIssue', {
      state: 'output-available',
      input: {
        issueId: 123,
      },
      output: {
        success: false,
        issueId: 123,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <DeleteIssueTool part={args.part} />,
}

export const DeleteIssueInputAvailable: DeleteIssueStory = {
  args: {
    part: createToolPart('deleteIssue', {
      state: 'input-available',
      input: {
        issueId: 123,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <DeleteIssueTool part={args.part} />,
}

export const DeleteIssueApprovalRequested: DeleteIssueStory = {
  args: {
    part: createToolPart('deleteIssue', {
      state: 'input-available',
      input: {
        issueId: 123,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => (
    <ToolApprovalProvider
      value={{
        approvalStates: {
          [args.part.toolCallId]: 'approval-requested',
        },
        respondToolCall: async () => {},
      }}>
      {renderToolPart(args.part)}
    </ToolApprovalProvider>
  ),
}

export const DeleteIssueCompleted: DeleteIssueStory = {
  args: {
    part: createToolPart('deleteIssue', {
      state: 'output-available',
      input: {
        issueId: 123,
      },
      output: {
        success: true,
        issueId: 123,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <DeleteIssueTool part={args.part} />,
}

// Other tools - Only show completed state

type QueryPropertiesStory = StoryObj<typeof QueryPropertiesTool>

export const QueryPropertiesRunning: QueryPropertiesStory = {
  args: {
    part: createToolPart('queryProperties', {
      state: 'input-available',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <QueryPropertiesTool part={args.part} />,
}

export const QueryPropertiesCompleted: QueryPropertiesStory = {
  args: {
    part: createToolPart('queryProperties', {
      state: 'output-available',
      output: {
        properties: [
          { id: 'prop-1', name: 'Title', type: 'text', readonly: true, deletable: false },
          { id: 'prop-2', name: 'Priority', type: 'select', readonly: false, deletable: true },
          { id: 'prop-3', name: 'Status', type: 'status', readonly: false, deletable: true },
        ],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <QueryPropertiesTool part={args.part} />,
}

export const QueryPropertiesError: QueryPropertiesStory = {
  args: {
    part: createToolPart('queryProperties', {
      state: 'output-error',
      errorText: 'Failed to fetch properties from database',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <QueryPropertiesTool part={args.part} />,
}

type GetAvailableUsersStory = StoryObj<typeof GetAvailableUsersTool>

export const GetAvailableUsersRunning: GetAvailableUsersStory = {
  args: {
    part: createToolPart('getAvailableUsers', {
      state: 'input-available',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetAvailableUsersTool part={args.part} />,
}

export const GetAvailableUsersCompleted: GetAvailableUsersStory = {
  args: {
    part: createToolPart('getAvailableUsers', {
      state: 'output-available',
      output: {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetAvailableUsersTool part={args.part} />,
}

export const GetAvailableUsersError: GetAvailableUsersStory = {
  args: {
    part: createToolPart('getAvailableUsers', {
      state: 'output-error',
      errorText: 'Failed to fetch users',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetAvailableUsersTool part={args.part} />,
}

type GetCurrentUserStory = StoryObj<typeof GetCurrentUserTool>

export const GetCurrentUserRunning: GetCurrentUserStory = {
  args: {
    part: createToolPart('getCurrentUser', {
      state: 'input-available',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetCurrentUserTool part={args.part} />,
}

export const GetCurrentUserCompleted: GetCurrentUserStory = {
  args: {
    part: createToolPart('getCurrentUser', {
      state: 'output-available',
      output: {
        id: 'current-user-123',
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetCurrentUserTool part={args.part} />,
}

export const GetCurrentUserError: GetCurrentUserStory = {
  args: {
    part: createToolPart('getCurrentUser', {
      state: 'output-error',
      errorText: 'Failed to get current user',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetCurrentUserTool part={args.part} />,
}

type ListTodosStory = StoryObj<typeof ListTodosTool>

export const ListTodosRunning: ListTodosStory = {
  args: {
    part: createToolPart('listTodos', {
      state: 'input-available',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <ListTodosTool part={args.part} />,
}

export const ListTodosError: ListTodosStory = {
  args: {
    part: createToolPart('listTodos', {
      state: 'output-error',
      errorText: 'Failed to fetch todos',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <ListTodosTool part={args.part} />,
}

export const ListTodosEmpty: ListTodosStory = {
  args: {
    part: createToolPart('listTodos', {
      state: 'output-available',
      output: {
        items: [],
        count: 0,
        completedCount: 0,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <ListTodosTool part={args.part} />,
}

export const ListTodosCompleted: ListTodosStory = {
  args: {
    part: createToolPart('listTodos', {
      state: 'output-available',
      output: {
        items: [
          {
            id: 'todo-1',
            text: 'Buy milk',
            completed: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'todo-2',
            text: 'Walk dog',
            completed: true,
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
          {
            id: 'todo-3',
            text: 'Finish report',
            completed: false,
            createdAt: '2024-01-03T00:00:00Z',
            updatedAt: '2024-01-03T00:00:00Z',
          },
        ],
        count: 3,
        completedCount: 1,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <ListTodosTool part={args.part} />,
}

type AddMultipleTodosStory = StoryObj<typeof AddMultipleTodosTool>

export const AddMultipleTodosRunning: AddMultipleTodosStory = {
  args: {
    part: createToolPart('addMultipleTodos', {
      state: 'input-available',
      input: {
        items: [{ text: 'Buy groceries' }, { text: 'Walk dog' }],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <AddMultipleTodosTool part={args.part} />,
}

export const AddMultipleTodosCompleted: AddMultipleTodosStory = {
  args: {
    part: createToolPart('addMultipleTodos', {
      state: 'output-available',
      input: {
        items: [{ text: 'Buy groceries' }, { text: 'Walk dog' }],
      },
      output: {
        success: true,
        todos: [
          {
            id: 'todo-new-1',
            text: 'Buy groceries',
            completed: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'todo-new-2',
            text: 'Walk dog',
            completed: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        count: 2,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <AddMultipleTodosTool part={args.part} />,
}

type ToggleMultipleTodosStory = StoryObj<typeof ToggleMultipleTodosTool>

export const ToggleMultipleTodosRunning: ToggleMultipleTodosStory = {
  args: {
    part: createToolPart('toggleMultipleTodos', {
      state: 'input-available',
      input: {
        ids: ['todo-1', 'todo-2'],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <ToggleMultipleTodosTool part={args.part} />,
}

export const ToggleMultipleTodosCompleted: ToggleMultipleTodosStory = {
  args: {
    part: createToolPart('toggleMultipleTodos', {
      state: 'output-available',
      input: {
        ids: ['todo-1', 'todo-2'],
      },
      output: {
        success: true,
        toggled: [
          {
            id: 'todo-1',
            text: 'Buy milk',
            completed: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
          {
            id: 'todo-2',
            text: 'Walk dog',
            completed: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ],
        notFound: [],
        count: 2,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <ToggleMultipleTodosTool part={args.part} />,
}

type DeleteMultipleTodosStory = StoryObj<typeof DeleteMultipleTodosTool>

export const DeleteMultipleTodosRunning: DeleteMultipleTodosStory = {
  args: {
    part: createToolPart('deleteMultipleTodos', {
      state: 'input-available',
      input: {
        ids: ['todo-1', 'todo-2'],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <DeleteMultipleTodosTool part={args.part} />,
}

export const DeleteMultipleTodosCompleted: DeleteMultipleTodosStory = {
  args: {
    part: createToolPart('deleteMultipleTodos', {
      state: 'output-available',
      input: {
        ids: ['todo-1', 'todo-2'],
      },
      output: {
        success: true,
        deleted: [
          {
            id: 'todo-1',
            text: 'Buy milk',
            completed: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
          {
            id: 'todo-2',
            text: 'Walk dog',
            completed: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ],
        notFound: [],
        remainingCount: 1,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <DeleteMultipleTodosTool part={args.part} />,
}

type GetIssuesStory = StoryObj<typeof GetIssuesTool>

export const GetIssuesRunning: GetIssuesStory = {
  args: {
    part: createToolPart('getIssues', {
      state: 'input-available',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetIssuesTool part={args.part} />,
}

export const GetIssuesCompleted: GetIssuesStory = {
  args: {
    part: createToolPart('getIssues', {
      state: 'output-available',
      output: {
        issues: [
          {
            issueId: 1,
            propertyValues: [
              { propertyId: 'property0003', value: 'in_progress' },
              { propertyId: 'property0007', value: 'high' },
              { propertyId: 'property0002', value: 'Server outage in datacenter' },
              { propertyId: 'property0012', value: 'user-1' },
            ],
          },
          {
            issueId: 2,
            propertyValues: [
              { propertyId: 'property0003', value: 'planning' },
              { propertyId: 'property0007', value: 'medium' },
              { propertyId: 'property0002', value: 'Update documentation' },
              { propertyId: 'property0012', value: 'user-2' },
            ],
          },
          {
            issueId: 3,
            propertyValues: [
              { propertyId: 'property0003', value: 'completed' },
              { propertyId: 'property0007', value: 'low' },
              { propertyId: 'property0002', value: 'Fix typo in README' },
              { propertyId: 'property0012', value: null },
            ],
          },
        ],
        total: 3,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetIssuesTool part={args.part} />,
}

export const GetIssuesEmpty: GetIssuesStory = {
  args: {
    part: createToolPart('getIssues', {
      state: 'output-available',
      output: {
        issues: [],
        total: 0,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetIssuesTool part={args.part} />,
}

export const GetIssuesError: GetIssuesStory = {
  args: {
    part: createToolPart('getIssues', {
      state: 'output-error',
      errorText: 'Failed to fetch issues from database',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetIssuesTool part={args.part} />,
}

// Get Issue By ID Tool Stories
type GetIssueByIdStory = StoryObj<typeof GetIssueByIdTool>

export const GetIssueByIdRunning: GetIssueByIdStory = {
  args: {
    part: createToolPart('getIssueById', {
      state: 'input-available',
      input: {
        issueId: 123,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetIssueByIdTool part={args.part} />,
}

export const GetIssueByIdCompleted: GetIssueByIdStory = {
  args: {
    part: createToolPart('getIssueById', {
      state: 'output-available',
      input: {
        issueId: 123,
      },
      output: {
        issueId: 123,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetIssueByIdTool part={args.part} />,
}

export const GetIssueByIdError: GetIssueByIdStory = {
  args: {
    part: createToolPart('getIssueById', {
      state: 'output-error',
      input: {
        issueId: 123,
      },
      errorText: 'Issue not found',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetIssueByIdTool part={args.part} />,
}

// Get Comments Tool Stories
type GetCommentsStory = StoryObj<typeof GetCommentsTool>

export const GetCommentsRunning: GetCommentsStory = {
  args: {
    part: createToolPart('getComments', {
      state: 'input-available',
      input: {
        issueId: 123,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetCommentsTool part={args.part} />,
}

export const GetCommentsCompleted: GetCommentsStory = {
  args: {
    part: createToolPart('getComments', {
      state: 'output-available',
      input: {
        issueId: 123,
      },
      output: {
        comments: [
          { id: 'comment-1', content: 'This is a comment' },
          { id: 'comment-2', content: 'Another comment here' },
        ],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetCommentsTool part={args.part} />,
}

export const GetCommentsEmpty: GetCommentsStory = {
  args: {
    part: createToolPart('getComments', {
      state: 'output-available',
      input: {
        issueId: 123,
      },
      output: {
        comments: [],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetCommentsTool part={args.part} />,
}

export const GetCommentsError: GetCommentsStory = {
  args: {
    part: createToolPart('getComments', {
      state: 'output-error',
      input: {
        issueId: 123,
      },
      errorText: 'Failed to fetch comments',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetCommentsTool part={args.part} />,
}

// Create Comment Tool Stories
type CreateCommentStory = StoryObj<typeof CreateCommentTool>

export const CreateCommentRunning: CreateCommentStory = {
  args: {
    part: createToolPart('createComment', {
      state: 'input-available',
      input: {
        issueId: 123,
        content: 'This is a new comment',
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <CreateCommentTool part={args.part} />,
}

export const CreateCommentCompleted: CreateCommentStory = {
  args: {
    part: createToolPart('createComment', {
      state: 'output-available',
      input: {
        issueId: 123,
        content: 'This is a new comment',
      },
      output: {
        id: 'comment-new-1',
        content: 'This is a new comment',
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <CreateCommentTool part={args.part} />,
}

export const CreateCommentError: CreateCommentStory = {
  args: {
    part: createToolPart('createComment', {
      state: 'output-error',
      input: {
        issueId: 123,
        content: '',
      },
      errorText: 'Comment content cannot be empty',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <CreateCommentTool part={args.part} />,
}

// Update Comment Tool Stories
type UpdateCommentStory = StoryObj<typeof UpdateCommentTool>

export const UpdateCommentRunning: UpdateCommentStory = {
  args: {
    part: createToolPart('updateComment', {
      state: 'input-available',
      input: {
        commentId: 'comment-1',
        content: 'Updated comment content',
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <UpdateCommentTool part={args.part} />,
}

export const UpdateCommentCompleted: UpdateCommentStory = {
  args: {
    part: createToolPart('updateComment', {
      state: 'output-available',
      input: {
        commentId: 'comment-1',
        content: 'Updated comment content',
      },
      output: {
        id: 'comment-1',
        content: 'Updated comment content',
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <UpdateCommentTool part={args.part} />,
}

export const UpdateCommentError: UpdateCommentStory = {
  args: {
    part: createToolPart('updateComment', {
      state: 'output-error',
      input: {
        commentId: 'comment-1',
        content: '',
      },
      errorText: 'Failed to update comment',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <UpdateCommentTool part={args.part} />,
}

// Delete Comment Tool Stories
type DeleteCommentStory = StoryObj<typeof DeleteCommentTool>

export const DeleteCommentRunning: DeleteCommentStory = {
  args: {
    part: createToolPart('deleteComment', {
      state: 'input-available',
      input: {
        commentId: 'comment-1',
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <DeleteCommentTool part={args.part} />,
}

export const DeleteCommentCompleted: DeleteCommentStory = {
  args: {
    part: createToolPart('deleteComment', {
      state: 'output-available',
      input: {
        commentId: 'comment-1',
      },
      output: {
        success: true,
        commentId: 'comment-1',
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <DeleteCommentTool part={args.part} />,
}

export const DeleteCommentError: DeleteCommentStory = {
  args: {
    part: createToolPart('deleteComment', {
      state: 'output-available',
      input: {
        commentId: 'comment-1',
      },
      output: {
        success: false,
        commentId: 'comment-1',
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <DeleteCommentTool part={args.part} />,
}

// Get Subscribers Tool Stories
type GetSubscribersStory = StoryObj<typeof GetSubscribersTool>

export const GetSubscribersRunning: GetSubscribersStory = {
  args: {
    part: createToolPart('getSubscribers', {
      state: 'input-available',
      input: {
        issueId: 123,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetSubscribersTool part={args.part} />,
}

export const GetSubscribersCompleted: GetSubscribersStory = {
  args: {
    part: createToolPart('getSubscribers', {
      state: 'output-available',
      input: {
        issueId: 123,
      },
      output: {
        subscriberIds: ['user-1', 'user-2', 'user-3'],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetSubscribersTool part={args.part} />,
}

export const GetSubscribersEmpty: GetSubscribersStory = {
  args: {
    part: createToolPart('getSubscribers', {
      state: 'output-available',
      input: {
        issueId: 123,
      },
      output: {
        subscriberIds: [],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetSubscribersTool part={args.part} />,
}

export const GetSubscribersError: GetSubscribersStory = {
  args: {
    part: createToolPart('getSubscribers', {
      state: 'output-error',
      input: {
        issueId: 123,
      },
      errorText: 'Failed to fetch subscribers',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <GetSubscribersTool part={args.part} />,
}

// Add Subscriber Tool Stories
type AddSubscriberStory = StoryObj<typeof AddSubscriberTool>

export const AddSubscriberRunning: AddSubscriberStory = {
  args: {
    part: createToolPart('addSubscriber', {
      state: 'input-available',
      input: {
        issueId: 123,
        userIds: ['user-1'],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <AddSubscriberTool part={args.part} />,
}

export const AddSubscriberCompleted: AddSubscriberStory = {
  args: {
    part: createToolPart('addSubscriber', {
      state: 'output-available',
      input: {
        issueId: 123,
        userIds: ['user-1'],
      },
      output: {
        success: true,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <AddSubscriberTool part={args.part} />,
}

export const AddSubscriberError: AddSubscriberStory = {
  args: {
    part: createToolPart('addSubscriber', {
      state: 'output-error',
      input: {
        issueId: 123,
        userIds: ['user-1'],
      },
      errorText: 'Failed to add subscriber',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <AddSubscriberTool part={args.part} />,
}

// Remove Subscriber Tool Stories
type RemoveSubscriberStory = StoryObj<typeof RemoveSubscriberTool>

export const RemoveSubscriberRunning: RemoveSubscriberStory = {
  args: {
    part: createToolPart('removeSubscriber', {
      state: 'input-available',
      input: {
        issueId: 123,
        userIds: ['user-1'],
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <RemoveSubscriberTool part={args.part} />,
}

export const RemoveSubscriberCompleted: RemoveSubscriberStory = {
  args: {
    part: createToolPart('removeSubscriber', {
      state: 'output-available',
      input: {
        issueId: 123,
        userIds: ['user-1'],
      },
      output: {
        success: true,
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <RemoveSubscriberTool part={args.part} />,
}

export const RemoveSubscriberError: RemoveSubscriberStory = {
  args: {
    part: createToolPart('removeSubscriber', {
      state: 'output-error',
      input: {
        issueId: 123,
        userIds: ['user-1'],
      },
      errorText: 'Failed to remove subscriber',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <RemoveSubscriberTool part={args.part} />,
}

// Fallback Tool Stories
type FallbackToolStory = StoryObj<typeof FallbackTool>

export const FallbackToolRunning: FallbackToolStory = {
  args: {
    part: createToolPart('unknownTool', {
      state: 'input-available',
      input: {
        someParam: 'value',
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <FallbackTool part={args.part} />,
}

export const FallbackToolCompleted: FallbackToolStory = {
  args: {
    part: createToolPart('unknownTool', {
      state: 'output-available',
      input: {
        someParam: 'value',
      },
      output: {
        result: 'some result',
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <FallbackTool part={args.part} />,
}

export const FallbackToolError: FallbackToolStory = {
  args: {
    part: createToolPart('unknownTool', {
      state: 'output-error',
      input: {
        someParam: 'value',
      },
      errorText: 'Unknown tool execution failed',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <FallbackTool part={args.part} />,
}
