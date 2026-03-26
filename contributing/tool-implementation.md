# Tool Implementation Guide

This guide explains how to implement a new Tool for the Agent system.

## Overview

A Tool consists of three parts:

1. **Shared Definition** - Tool name, types, and UI configuration (in `packages/shared`)
2. **Backend Implementation** - Tool execution logic (in `apps/api-server`)
3. **Frontend Renderer** - Tool UI component (in `apps/web`)

## Step-by-Step Implementation

### Step 1: Add Shared Definition

Edit `packages/shared/src/agent-tools/`:

#### 1.1 Add Tool Name Constant

In `constants.ts`:

```typescript
export const MY_NEW_TOOL = 'myNewTool' as const

// Add to ToolName union type
export type ToolName =
  | typeof QUERY_PROPERTIES_TOOL
  | typeof CREATE_ISSUE_TOOL
  // ... other tools
  | typeof MY_NEW_TOOL // Add here

// Add to ALL_TOOL_NAMES array
export const ALL_TOOL_NAMES: ToolName[] = [
  // ... other tools
  MY_NEW_TOOL,
]
```

#### 1.2 Define Input/Output Types

In `types.ts`:

```typescript
export interface MyNewToolInput {
  param1: string
  param2?: number
}

export interface MyNewToolOutput {
  result: string
  success: boolean
}
```

#### 1.3 Add UI Configuration

In `config.ts`:

```typescript
import { MY_NEW_TOOL } from './constants'

export const TOOL_UI_CONFIG: Record<ToolName, ToolUIConfig> = {
  // ... other tools
  [MY_NEW_TOOL]: {
    title: 'My New Tool',
    showInput: true, // Whether to show input parameters in UI
    showOutput: true, // Whether to show output result in UI
    defaultOpen: false, // Whether tool panel is expanded by default
  },
}
```

### Step 2: Implement Backend

Edit `apps/api-server/src/agent/tools/`:

#### 2.1 Create Tool Implementation

Create a new file or edit existing category file (e.g., `my-category.tools.ts`):

```typescript
import { tool } from 'ai'
import { z } from 'zod'

import { MY_NEW_TOOL } from '@repo/shared'
import type { AgentToolsContext } from './types'

export function createMyNewTool({ someService, workspaceId }: AgentToolsContext) {
  return tool({
    description: 'Description of what this tool does',
    inputSchema: z.object({
      param1: z.string().describe('Description of param1'),
      param2: z.number().optional().describe('Description of param2'),
    }),
    execute: async ({ param1, param2 }) => {
      // Implementation logic here
      const result = await someService.doSomething(param1, param2)

      return {
        result: result.data,
        success: true,
      }
    },
  })
}

export const myCategoryTools = {
  [MY_NEW_TOOL]: createMyNewTool,
  // ... other tools in same category
}
```

#### 2.2 Register Tool in Index

In `tools/index.ts`, add your tool to the exports:

```typescript
import { myCategoryTools } from './my-category.tools'

export function createAgentTools(context: AgentToolsContext): Record<string, Tool> {
  // ... existing setup

  return {
    ...Object.fromEntries(Object.entries(propertyTools).map(([name, createTool]) => [name, createTool(context)])),
    ...Object.fromEntries(Object.entries(userTools).map(([name, createTool]) => [name, createTool(context)])),
    ...Object.fromEntries(Object.entries(todoTools).map(([name, createTool]) => [name, createTool(todoDeps)])),
    ...Object.fromEntries(Object.entries(myCategoryTools).map(([name, createTool]) => [name, createTool(context)])),
  }
}
```

### Step 3: Add Frontend Renderer

Edit `apps/web/src/agent/components/tool-renderers/`:

#### 3.1 Add Tool Component

In `tool-components.tsx`, add a new component:

```typescript
export function MyNewTool({ part }: ToolComponentProps): JSX.Element {
  return <GenericToolComponent part={part} toolName="myNewTool" />
}
```

For custom UI, you can create a specialized component:

```typescript
export function MyNewTool({ part }: ToolComponentProps): JSX.Element {
  const hasContent = ('input' in part && part.input) || 'output' in part

  return (
    <Tool defaultOpen={false}>
      <ToolHeader type="tool-myNewTool" state={part.state} title="My New Tool" />
      {hasContent ? (
        <ToolContent>
          {'input' in part && part.input ? (
            <ToolInput input={part.input as Record<string, unknown>} />
          ) : null}
          {'output' in part && part.output ? (
            <CustomOutputDisplay output={part.output} />
          ) : null}
        </ToolContent>
      ) : null}
    </Tool>
  )
}
```

#### 3.2 Register in Tool Registry

In `tool-registry.tsx`, import and register your component:

```typescript
import {
  // ... other tools
  MyNewTool,
} from './tool-components'

const toolRegistry: Record<ToolName, ToolRenderer> = {
  // ... other tools
  myNewTool: MyNewTool,
}
```

#### 3.3 Add Storybook Story

In `tool-renderers.stories.tsx`, add stories for your tool component:

```typescript
import { MyNewTool } from './tool-components'

// Add story type
type MyNewToolStory = StoryObj<typeof MyNewTool>

// Example: Completed state
export const MyNewToolCompleted: MyNewToolStory = {
  args: {
    part: createToolPart('myNewTool', {
      state: 'output-available',
      input: {
        param1: 'test value',
        param2: 42,
      },
      output: {
        result: 'success',
        data: { ... },
      },
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <MyNewTool part={args.part} />,
}

// Example: Error state (if applicable)
export const MyNewToolError: MyNewToolStory = {
  args: {
    part: createToolPart('myNewTool', {
      state: 'output-error',
      input: {
        param1: 'invalid value',
      },
      errorText: 'Error message describing what went wrong',
    }),
  },
  argTypes: {
    part: { control: false },
  },
  render: args => <MyNewTool part={args.part} />,
}
```

**Story Requirements:**

- Add at least one story showing the completed/output-available state
- Add an error state story if the tool can fail
- Use the `createToolPart` helper to construct the `ToolUIPart` object
- Set `part: { control: false }` in `argTypes` to hide the complex object control

### Step 4: Add Tests

Edit `apps/api-server/src/agent/__tests__/agent.tools.spec.ts`:

```typescript
describe('myNewTool', () => {
  it('should execute successfully', async () => {
    // Mock service response
    mockSomeService.doSomething.mockResolvedValue({ data: 'result' })

    const tools = createTools()

    const result = await generateText({
      model: new MockLanguageModelV3({
        doGenerate: async () => ({
          content: [
            {
              type: 'tool-call' as const,
              toolCallId: 'call-1',
              toolName: 'myNewTool',
              input: JSON.stringify({ param1: 'test', param2: 42 }),
            },
          ],
          finishReason: { unified: 'stop' as const, raw: undefined },
          usage: {
            inputTokens: { total: 10, noCache: 10 },
            outputTokens: { total: 5, text: 5 },
          },
          warnings: [],
        }),
      }),
      tools,
      prompt: 'Execute my new tool',
    })

    expect(mockSomeService.doSomething).toHaveBeenCalledWith('test', 42)
    expect(result.toolCalls[0].toolName).toBe('myNewTool')
  })
})
```

## File Structure Reference

```
packages/shared/src/agent-tools/
├── constants.ts    # Add tool name constant
├── types.ts        # Add input/output types
└── config.ts       # Add UI configuration

apps/api-server/src/agent/tools/
├── types.ts              # AgentToolsContext interface
├── index.ts              # Register tool in createAgentTools
├── property.tools.ts     # Property-related tools
├── user.tools.ts         # User-related tools
└── todo.tools.ts         # Todo-related tools

apps/web/src/agent/components/tool-renderers/
├── tool-components.tsx       # Add React component
├── tool-registry.tsx         # Register component
└── tool-renderers.stories.tsx # Add Storybook stories

apps/web/src/agent/utils/
└── tool-query-invalidation.ts # Add query invalidation for data-modifying tools
```

### Step 5: Add Query Invalidation (for Data-Modifying Tools)

If your tool modifies data (create, update, delete), you **must** add query invalidation logic to ensure the UI refreshes after tool execution.

Edit `apps/web/src/agent/utils/tool-query-invalidation.ts`:

#### 5.1 Add Tool to Data-Modifying Tools List

```typescript
export const DATA_MODIFYING_TOOLS = [
  // ... existing tools
  'myNewTool', // Add your tool here
] as const
```

#### 5.2 Add Query Key Mapping

In `buildQueryKeysToInvalidate()` function, add a case for your tool:

```typescript
export function buildQueryKeysToInvalidate(
  toolName: DataModifyingTool,
  input: Record<string, unknown>,
  orgId: string,
): QueryKey[] {
  // ... existing cases

  switch (toolName) {
    // ... existing tools

    case 'myNewTool':
      // Extract relevant IDs from input if needed
      const itemId = typeof input.itemId === 'number' ? input.itemId : null

      if (itemId) {
        queryKeys.push(['api-server', 'myItem', itemId])
      }
      // Always invalidate list queries
      queryKeys.push(['api-server', 'myItems', orgId])
      break

    default:
      break
  }

  return queryKeys
}
```

#### 5.3 Query Key Naming Convention

Follow the existing query key patterns:

| Pattern                                      | Usage                       |
| -------------------------------------------- | --------------------------- |
| `['api-server', 'issue', issueId]`           | Single item query           |
| `['api-server', 'issues', orgId]`            | List query                  |
| `['api-server', 'issues-infinite', orgId]`   | Infinite list query         |
| `['api-server', 'issueComments', issueId]`   | Related data query          |
| `['api-server', 'issueActivities', issueId]` | Activity/subscription query |

**Note**: Query invalidation happens automatically in `AgentChatContainer` when a tool with `output-available` state is detected. You only need to add the tool name to `DATA_MODIFYING_TOOLS` and define which queries to invalidate.

## Best Practices

1. **Use Constants**: Always use the shared tool name constant, never hardcode strings
2. **Type Safety**: Define proper input/output types in shared package
3. **Error Handling**: Handle errors gracefully in tool execute functions
4. **Descriptions**: Write clear descriptions for tools and parameters (AI uses these)
5. **Zod Schemas**: Use `.describe()` on schema fields to help AI understand parameters
6. **UI Consistency**: Use `GenericToolComponent` for simple tools, custom UI only when needed
7. **Testing**: Add tests for both success and error cases
8. **Stories**: Every tool component must have corresponding Storybook stories
9. **Query Invalidation**: Always add query invalidation for data-modifying tools to ensure UI consistency

## Example: Complete Tool Implementation

See existing implementations for reference:

- Simple tool: `user.tools.ts` (getCurrentUser)
- Complex tool: `todo.tools.ts` (addTodo, toggleTodo)
- Service-based tool: `property.tools.ts` (createIssue)
