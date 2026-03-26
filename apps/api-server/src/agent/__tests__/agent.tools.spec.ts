import { generateText } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'

import { ActivityService } from '@/issue/activity.service'
import { CommentService } from '@/issue/comment.service'
import { IssueService } from '@/issue/issue.service'
import { PropertyService } from '@/property/property.service'
import { UserService } from '@/user/user.service'
import { AgentApprovalService } from '../agent-approval.service'
import { AgentService } from '../agent.service'
import { createAgentTools } from '../agent.tools'
import { SandboxService } from '../sandbox.service'

describe('Agent Tools', () => {
  let mockPropertyService: jest.Mocked<PropertyService>
  let mockIssueService: jest.Mocked<IssueService>
  let mockUserService: jest.Mocked<UserService>
  let mockCommentService: jest.Mocked<CommentService>
  let mockActivityService: jest.Mocked<ActivityService>
  let mockAgentService: jest.Mocked<AgentService>
  let mockApprovalService: jest.Mocked<AgentApprovalService>

  const workspaceId = 'test-workspace-123'
  const userId = 'test-user-456'
  const chatId = 'test-chat-789'

  beforeEach(() => {
    mockPropertyService = {
      getPropertyDefinitions: jest.fn(),
    } as unknown as jest.Mocked<PropertyService>

    mockIssueService = {
      batchCreateIssues: jest.fn(),
      getIssues: jest.fn(),
      getIssueById: jest.fn(),
      updateIssue: jest.fn(),
      deleteIssue: jest.fn(),
    } as unknown as jest.Mocked<IssueService>

    mockUserService = {
      getAvailableUsers: jest.fn(),
    } as unknown as jest.Mocked<UserService>

    mockCommentService = {
      queryComments: jest.fn(),
      createComment: jest.fn(),
      updateComment: jest.fn(),
      deleteComment: jest.fn(),
    } as unknown as jest.Mocked<CommentService>

    mockActivityService = {
      getActivities: jest.fn(),
      subscribeToIssue: jest.fn(),
      unsubscribeFromIssue: jest.fn(),
    } as unknown as jest.Mocked<ActivityService>

    mockAgentService = {
      getChatMetadata: jest.fn().mockResolvedValue(null),
      updateChatMetadata: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AgentService>

    mockApprovalService = {
      waitForApproval: jest.fn().mockResolvedValue(undefined),
      resolveApproval: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as unknown as jest.Mocked<AgentApprovalService>
  })

  let mockSandboxService: jest.Mocked<SandboxService>

  beforeEach(() => {
    mockSandboxService = {
      getSandboxTools: jest.fn().mockReturnValue({
        bash: {
          name: 'bash',
          description: 'Execute bash commands',
          parameters: {},
          execute: jest.fn(),
        },
        readFile: {
          name: 'readFile',
          description: 'Read a file',
          parameters: {},
          execute: jest.fn(),
        },
        writeFile: {
          name: 'writeFile',
          description: 'Write a file',
          parameters: {},
          execute: jest.fn(),
        },
      }),
    } as unknown as jest.Mocked<SandboxService>
  })

  // Helper function to create tools with all required context
  const createTools = () =>
    createAgentTools({
      context: {
        propertyService: mockPropertyService,
        issueService: mockIssueService,
        userService: mockUserService,
        commentService: mockCommentService,
        activityService: mockActivityService,
        agentService: mockAgentService,
        workspaceId,
        userId,
        chatId,
      },
      sandboxService: mockSandboxService,
      approvalService: mockApprovalService,
    })

  describe('getAvailableUsers tool', () => {
    it('should return list of users from userService', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          username: 'Alice',
          imageUrl: 'https://example.com/alice.png',
          hasImage: true,
        },
        {
          id: 'user-2',
          username: 'Bob',
          imageUrl: '',
          hasImage: false,
        },
      ]
      mockUserService.getAvailableUsers.mockResolvedValue(mockUsers)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-1',
                toolName: 'getAvailableUsers',
                input: '{}',
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Get all users',
      })

      expect(mockUserService.getAvailableUsers).toHaveBeenCalledWith(workspaceId)
      expect(result.toolCalls).toHaveLength(1)
      expect(result.toolCalls[0].toolName).toBe('getAvailableUsers')
    })

    it('should return empty array when no users available', async () => {
      mockUserService.getAvailableUsers.mockResolvedValue([])

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-2',
                toolName: 'getAvailableUsers',
                input: '{}',
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Get all users',
      })

      expect(mockUserService.getAvailableUsers).toHaveBeenCalledWith(workspaceId)
      expect(result.toolCalls[0].toolName).toBe('getAvailableUsers')
    })
  })

  describe('getCurrentUser tool', () => {
    it('should return current user id from context', async () => {
      const tools = createAgentTools({
        context: {
          propertyService: mockPropertyService,
          issueService: mockIssueService,
          userService: mockUserService,
          commentService: mockCommentService,
          activityService: mockActivityService,
          agentService: mockAgentService,
          workspaceId,
          userId: 'current-user-789',
          chatId,
        },
        sandboxService: mockSandboxService,
        approvalService: mockApprovalService,
      })

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-3',
                toolName: 'getCurrentUser',
                input: '{}',
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Who am I?',
      })

      expect(result.toolCalls).toHaveLength(1)
      expect(result.toolCalls[0].toolName).toBe('getCurrentUser')
    })
  })

  describe('queryProperties tool', () => {
    it('should return property definitions from propertyService', async () => {
      const mockProperties = [
        {
          id: 'prop-1',
          name: 'Title',
          type: 'text',
          readonly: true,
          deletable: false,
        },
        {
          id: 'prop-2',
          name: 'Priority',
          type: 'select',
          readonly: false,
          deletable: true,
        },
        {
          id: 'status',
          name: 'Status',
          type: 'status',
          readonly: false,
          deletable: false,
        },
      ]
      mockPropertyService.getPropertyDefinitions.mockResolvedValue(mockProperties)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-4',
                toolName: 'queryProperties',
                input: '{}',
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'List all properties',
      })

      expect(mockPropertyService.getPropertyDefinitions).toHaveBeenCalled()
      expect(result.toolCalls[0].toolName).toBe('queryProperties')
    })
  })

  describe('createIssue tool', () => {
    it('should create a single issue with property values', async () => {
      mockIssueService.batchCreateIssues.mockResolvedValue([
        {
          issueId: 123,
          success: true,
          errors: [],
        },
      ])

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-5',
                toolName: 'createIssue',
                input: JSON.stringify({
                  issues: [
                    {
                      propertyValues: [
                        { propertyId: 'prop-1', value: 'Test Issue' },
                        { propertyId: 'prop-2', value: 'high' },
                      ],
                    },
                  ],
                }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Create an issue',
      })

      expect(mockIssueService.batchCreateIssues).toHaveBeenCalledWith(workspaceId, userId, [
        {
          propertyValues: [
            { propertyId: 'prop-1', value: 'Test Issue' },
            { propertyId: 'prop-2', value: 'high' },
          ],
        },
      ])
      expect(result.toolCalls[0].toolName).toBe('createIssue')
    })

    it('should create multiple issues in batch', async () => {
      mockIssueService.batchCreateIssues.mockResolvedValue([
        {
          issueId: 123,
          success: true,
          errors: [],
        },
        {
          issueId: 124,
          success: true,
          errors: [],
        },
      ])

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-batch',
                toolName: 'createIssue',
                input: JSON.stringify({
                  issues: [
                    {
                      propertyValues: [
                        { propertyId: 'prop-1', value: 'First Issue' },
                        { propertyId: 'prop-2', value: 'high' },
                      ],
                    },
                    {
                      propertyValues: [
                        { propertyId: 'prop-1', value: 'Second Issue' },
                        { propertyId: 'prop-2', value: 'low' },
                      ],
                    },
                  ],
                }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Create two issues',
      })

      expect(mockIssueService.batchCreateIssues).toHaveBeenCalledWith(workspaceId, userId, [
        {
          propertyValues: [
            { propertyId: 'prop-1', value: 'First Issue' },
            { propertyId: 'prop-2', value: 'high' },
          ],
        },
        {
          propertyValues: [
            { propertyId: 'prop-1', value: 'Second Issue' },
            { propertyId: 'prop-2', value: 'low' },
          ],
        },
      ])
      expect(result.toolCalls[0].toolName).toBe('createIssue')
    })

    it('should handle issue creation failure', async () => {
      mockIssueService.batchCreateIssues.mockResolvedValue([
        {
          issueId: 0,
          success: false,
          errors: ['Invalid property value'],
        },
      ])

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-6',
                toolName: 'createIssue',
                input: JSON.stringify({
                  issues: [
                    {
                      propertyValues: [{ propertyId: 'prop-1', value: '' }],
                    },
                  ],
                }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Create an issue',
      })

      expect(mockIssueService.batchCreateIssues).toHaveBeenCalled()
      expect(result.toolCalls[0].toolName).toBe('createIssue')
    })
  })

  describe('listTodos tool', () => {
    it('should return empty array when no todos exist', async () => {
      mockAgentService.getChatMetadata.mockResolvedValue(null)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-todo-1',
                toolName: 'listTodos',
                input: '{}',
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'List my todos',
      })

      expect(mockAgentService.getChatMetadata).toHaveBeenCalledWith(chatId)
      expect(result.toolCalls[0].toolName).toBe('listTodos')
    })

    it('should return existing todos', async () => {
      mockAgentService.getChatMetadata.mockResolvedValue({
        state: {
          todoList: {
            items: [
              { id: 'todo-1', text: 'Buy milk', completed: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
              { id: 'todo-2', text: 'Walk dog', completed: true, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
            ],
          },
        },
      })

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-todo-2',
                toolName: 'listTodos',
                input: '{}',
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'List my todos',
      })

      expect(result.toolCalls[0].toolName).toBe('listTodos')
    })
  })

  describe('addMultipleTodos tool', () => {
    it('should add multiple todos at once', async () => {
      mockAgentService.getChatMetadata.mockResolvedValue({ state: {} })

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-todo-batch-1',
                toolName: 'addMultipleTodos',
                input: JSON.stringify({
                  items: [{ text: 'Task 1' }, { text: 'Task 2' }, { text: 'Task 3' }],
                }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Add multiple todos',
      })

      expect(mockAgentService.updateChatMetadata).toHaveBeenCalledWith(
        chatId,
        expect.objectContaining({
          state: expect.objectContaining({
            todoList: expect.objectContaining({
              items: expect.arrayContaining([
                expect.objectContaining({ text: 'Task 1' }),
                expect.objectContaining({ text: 'Task 2' }),
                expect.objectContaining({ text: 'Task 3' }),
              ]),
            }),
          }),
        }),
      )
      expect(result.toolCalls[0].toolName).toBe('addMultipleTodos')
    })
  })

  describe('toggleMultipleTodos tool', () => {
    it('should toggle multiple todos at once', async () => {
      mockAgentService.getChatMetadata.mockResolvedValue({
        state: {
          todoList: {
            items: [
              { id: 'todo-1', text: 'Task 1', completed: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
              { id: 'todo-2', text: 'Task 2', completed: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
              { id: 'todo-3', text: 'Task 3', completed: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            ],
          },
        },
      })

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-todo-batch-2',
                toolName: 'toggleMultipleTodos',
                input: JSON.stringify({ ids: ['todo-1', 'todo-2'] }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Toggle multiple todos',
      })

      expect(mockAgentService.updateChatMetadata).toHaveBeenCalled()
      expect(result.toolCalls[0].toolName).toBe('toggleMultipleTodos')
    })

    it('should handle non-existent todos when toggling multiple', async () => {
      mockAgentService.getChatMetadata.mockResolvedValue({
        state: {
          todoList: {
            items: [
              { id: 'todo-1', text: 'Task 1', completed: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            ],
          },
        },
      })

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-todo-batch-3',
                toolName: 'toggleMultipleTodos',
                input: JSON.stringify({ ids: ['todo-1', 'non-existent'] }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Toggle multiple todos with one non-existent',
      })

      expect(result.toolCalls[0].toolName).toBe('toggleMultipleTodos')
    })
  })

  describe('deleteMultipleTodos tool', () => {
    it('should delete multiple todos at once', async () => {
      mockAgentService.getChatMetadata.mockResolvedValue({
        state: {
          todoList: {
            items: [
              { id: 'todo-1', text: 'Task 1', completed: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
              { id: 'todo-2', text: 'Task 2', completed: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
              { id: 'todo-3', text: 'Task 3', completed: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            ],
          },
        },
      })

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-todo-batch-4',
                toolName: 'deleteMultipleTodos',
                input: JSON.stringify({ ids: ['todo-1', 'todo-2'] }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Delete multiple todos',
      })

      expect(mockAgentService.updateChatMetadata).toHaveBeenCalledWith(
        chatId,
        expect.objectContaining({
          state: expect.objectContaining({
            todoList: expect.objectContaining({
              items: expect.arrayContaining([expect.objectContaining({ id: 'todo-3' })]),
            }),
          }),
        }),
      )
      expect(result.toolCalls[0].toolName).toBe('deleteMultipleTodos')
    })

    it('should handle non-existent todos when deleting multiple', async () => {
      mockAgentService.getChatMetadata.mockResolvedValue({
        state: {
          todoList: {
            items: [
              { id: 'todo-1', text: 'Task 1', completed: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            ],
          },
        },
      })

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-todo-batch-5',
                toolName: 'deleteMultipleTodos',
                input: JSON.stringify({ ids: ['todo-1', 'non-existent'] }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Delete multiple todos with one non-existent',
      })

      expect(result.toolCalls[0].toolName).toBe('deleteMultipleTodos')
    })
  })

  describe('getIssues tool', () => {
    it('should return list of issues', async () => {
      const mockIssues = {
        issues: [
          { issueId: 1, propertyValues: [{ propertyId: 'title', value: 'Issue 1' }] },
          { issueId: 2, propertyValues: [{ propertyId: 'title', value: 'Issue 2' }] },
        ],
        total: 2,
      }
      mockIssueService.getIssues.mockResolvedValue(mockIssues)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-issue-1',
                toolName: 'getIssues',
                input: '{}',
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'List all issues',
      })

      expect(mockIssueService.getIssues).toHaveBeenCalledWith(undefined, [], workspaceId, 'and', undefined, undefined)
      expect(result.toolCalls[0].toolName).toBe('getIssues')
    })

    it('should filter issues by property', async () => {
      const mockIssues = {
        issues: [{ issueId: 1, propertyValues: [{ propertyId: 'title', value: 'High Priority' }] }],
        total: 1,
      }
      mockIssueService.getIssues.mockResolvedValue(mockIssues)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-issue-2',
                toolName: 'getIssues',
                input: JSON.stringify({
                  filters: [{ propertyId: 'status', operator: 'equals', operand: 'todo', propertyType: 'status' }],
                }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Find todo issues',
      })

      expect(mockIssueService.getIssues).toHaveBeenCalled()
      expect(result.toolCalls[0].toolName).toBe('getIssues')
    })
  })

  describe('getIssueById tool', () => {
    it('should return issue details', async () => {
      const mockIssue = { issueId: 123, propertyValues: [{ propertyId: 'title', value: 'Test Issue' }] }
      mockIssueService.getIssueById.mockResolvedValue(mockIssue)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-issue-3',
                toolName: 'getIssueById',
                input: JSON.stringify({ issueId: 123 }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Get issue 123',
      })

      expect(mockIssueService.getIssueById).toHaveBeenCalledWith(123)
      expect(result.toolCalls[0].toolName).toBe('getIssueById')
    })
  })

  describe('updateIssue tool', () => {
    it('should update issue properties', async () => {
      mockIssueService.updateIssue.mockResolvedValue({ success: true, issueId: 123 })

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-issue-4',
                toolName: 'updateIssue',
                input: JSON.stringify({
                  issueId: 123,
                  operations: [
                    { propertyId: 'status', operationType: 'set', operationPayload: { value: 'in_progress' } },
                  ],
                }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Update issue 123 status',
      })

      expect(mockIssueService.updateIssue).toHaveBeenCalledWith(
        { workspaceId, userId },
        {
          issueId: 123,
          operations: [{ propertyId: 'status', operationType: 'set', operationPayload: { value: 'in_progress' } }],
        },
      )
      expect(result.toolCalls[0].toolName).toBe('updateIssue')
    })
  })

  describe('deleteIssue tool', () => {
    it('should delete an issue', async () => {
      mockIssueService.deleteIssue.mockResolvedValue(undefined)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-issue-5',
                toolName: 'deleteIssue',
                input: JSON.stringify({ issueId: 123 }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Delete issue 123',
      })

      expect(mockIssueService.deleteIssue).toHaveBeenCalledWith(workspaceId, userId, 123)
      expect(result.toolCalls[0].toolName).toBe('deleteIssue')
    })
  })

  describe('getComments tool', () => {
    it('should return comments for an issue', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          issueId: 123,
          content: 'First comment',
          createdBy: 'user-1',
          parentId: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]
      mockCommentService.queryComments.mockResolvedValue(mockComments)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-comment-1',
                toolName: 'getComments',
                input: JSON.stringify({ issueId: 123 }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Get comments for issue 123',
      })

      expect(mockCommentService.queryComments).toHaveBeenCalledWith(123)
      expect(result.toolCalls[0].toolName).toBe('getComments')
    })
  })

  describe('createComment tool', () => {
    it('should create a comment on an issue', async () => {
      const mockComment = {
        id: 'comment-1',
        issueId: 123,
        content: 'New comment',
        createdBy: userId,
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      mockCommentService.createComment.mockResolvedValue(mockComment)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-comment-2',
                toolName: 'createComment',
                input: JSON.stringify({ issueId: 123, content: 'New comment' }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Add comment to issue 123',
      })

      expect(mockCommentService.createComment).toHaveBeenCalledWith(123, 'New comment', userId, undefined)
      expect(result.toolCalls[0].toolName).toBe('createComment')
    })
  })

  describe('updateComment tool', () => {
    it('should update a comment', async () => {
      const mockComment = {
        id: 'comment-1',
        issueId: 123,
        content: 'Updated content',
        createdBy: userId,
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      mockCommentService.updateComment.mockResolvedValue(mockComment)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-comment-3',
                toolName: 'updateComment',
                input: JSON.stringify({ commentId: 'comment-1', content: 'Updated content' }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Update comment',
      })

      expect(mockCommentService.updateComment).toHaveBeenCalledWith(userId, 'comment-1', 'Updated content')
      expect(result.toolCalls[0].toolName).toBe('updateComment')
    })
  })

  describe('deleteComment tool', () => {
    it('should delete a comment', async () => {
      mockCommentService.deleteComment.mockResolvedValue(undefined)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-comment-4',
                toolName: 'deleteComment',
                input: JSON.stringify({ commentId: 'comment-1' }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Delete comment',
      })

      expect(mockCommentService.deleteComment).toHaveBeenCalledWith(userId, 'comment-1')
      expect(result.toolCalls[0].toolName).toBe('deleteComment')
    })
  })

  describe('getSubscribers tool', () => {
    it('should return subscribers for an issue', async () => {
      mockActivityService.getActivities.mockResolvedValue({
        total: 0,
        activities: [],
        subscriberIds: ['user-1', 'user-2'],
      })

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-sub-1',
                toolName: 'getSubscribers',
                input: JSON.stringify({ issueId: 123 }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Get subscribers for issue 123',
      })

      expect(mockActivityService.getActivities).toHaveBeenCalledWith(123, true)
      expect(result.toolCalls[0].toolName).toBe('getSubscribers')
    })
  })

  describe('addSubscriber tool', () => {
    it('should add subscribers to an issue', async () => {
      mockActivityService.subscribeToIssue.mockResolvedValue(undefined)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-sub-2',
                toolName: 'addSubscriber',
                input: JSON.stringify({ issueId: 123, userIds: ['user-1', 'user-2'] }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Add subscribers to issue 123',
      })

      expect(mockActivityService.subscribeToIssue).toHaveBeenCalledWith(123, ['user-1', 'user-2'])
      expect(result.toolCalls[0].toolName).toBe('addSubscriber')
    })
  })

  describe('removeSubscriber tool', () => {
    it('should remove subscribers from an issue', async () => {
      mockActivityService.unsubscribeFromIssue.mockResolvedValue(undefined)

      const tools = createTools()

      const result = await generateText({
        model: new MockLanguageModelV3({
          doGenerate: async () => ({
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: 'call-sub-3',
                toolName: 'removeSubscriber',
                input: JSON.stringify({ issueId: 123, userIds: ['user-1'] }),
              },
            ],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 5, text: 5, reasoning: undefined },
            },
            warnings: [],
          }),
        }),
        tools,
        prompt: 'Remove subscriber from issue 123',
      })

      expect(mockActivityService.unsubscribeFromIssue).toHaveBeenCalledWith(123, ['user-1'])
      expect(result.toolCalls[0].toolName).toBe('removeSubscriber')
    })
  })
})
