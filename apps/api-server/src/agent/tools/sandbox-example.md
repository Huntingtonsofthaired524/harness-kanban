# Sandbox (bash-tool) Integration Guide

> This feature is temporarily disabled, but the complete solution is preserved for future reference.

## Overview

Integrate the `bash-tool` package to provide a secure sandbox environment for the AI Agent, allowing execution of bash commands and file operations.

## Dependencies

```json
{
  "bash-tool": "^1.3.14",
  "just-bash": "^2.10.0"
}
```

## Core Implementation

### 1. Dynamic Import of ESM Module

```typescript
// apps/api-server/src/agent/tools/index.ts

export async function createAgentTools(context: AgentToolsContext): Promise<Record<string, Tool>> {
  // ... other code ...

  // Dynamic import for ESM-only module
  const { createBashTool } = await import('bash-tool')
  const { Bash } = await import('just-bash')
  const env = new Bash({
    python: true,
  })
  const bashToolkit = await createBashTool({
    sandbox: env,
  })

  return {
    // ... other tools ...
    ...bashToolkit.tools, // Spread bash, readFile, writeFile tools
  }
}
```

### 2. Caller Uses await

```typescript
// apps/api-server/src/agent/agent.controller.ts

const tools = await createAgentTools({
  propertyService: this.propertyService,
  issueService: this.issueService,
  // ... other dependencies
})
```

### 3. Jest Test Configuration

```json
// apps/api-server/package.json
{
  "jest": {
    "transformIgnorePatterns": ["node_modules/(?!(bash-tool|just-bash)/)"],
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/$1",
      "^bash-tool$": "<rootDir>/test/mocks/bash-tool.mock.ts"
    }
  }
}
```

### 4. Mock Implementation

```typescript
// apps/api-server/src/test/mocks/bash-tool.mock.ts

export const createBashTool = jest.fn().mockResolvedValue({
  tools: {
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
  },
  sandbox: {
    stop: jest.fn(),
  },
})
```

### 5. Test File Updates

```typescript
// apps/api-server/src/agent/__tests__/agent.tools.spec.ts

// Change helper function to async
const createTools = async () =>
  createAgentTools({
    // ... dependencies
  })

// Add await when calling
const tools = await createTools()
```

## Important Notes

1. **ESM Module**: `bash-tool` is a pure ESM module, must use dynamic import `await import()`
2. **Async Function**: `createBashTool` returns `Promise<BashToolkit>`, requires await
3. **NestJS Compatibility**: Since NestJS uses CommonJS, cannot use top-level await, must dynamically import inside functions
4. **Jest Testing**: Need to configure `transformIgnorePatterns` and `moduleNameMapper` to handle ESM modules

## Enable Steps

1. Ensure dependencies are installed: `bash-tool`, `just-bash`
2. Restore sandbox code in `apps/api-server/src/agent/tools/index.ts`
3. Ensure caller uses `await createAgentTools(...)`
4. Update Jest configuration and mock files
