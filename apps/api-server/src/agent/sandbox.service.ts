import { z } from 'zod'

import { Injectable, OnModuleDestroy } from '@nestjs/common'

// Type will be imported dynamically
type BashToolkit = unknown

interface SandboxEntry {
  toolkit: BashToolkit
  lastActivityAt: Date
}

// Tool type matching AI SDK's expected shape

type ToolConfig = any

/**
 * Service to manage sandbox environments per chat
 * Sandboxes are created lazily when first used
 * Auto-cleaned up after 24 hours of inactivity
 */
@Injectable()
export class SandboxService implements OnModuleDestroy {
  private readonly sandboxes = new Map<string, SandboxEntry>()
  private readonly pendingCreation = new Map<string, Promise<BashToolkit>>()
  private readonly cleanupIntervalMs = 60 * 60 * 1000 // 1 hour
  private readonly maxInactiveMs = 24 * 60 * 60 * 1000 // 24 hours
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startCleanupInterval()
  }

  /**
   * Create a new sandbox environment
   */
  private async createSandbox(): Promise<BashToolkit> {
    const { createBashTool } = await import('bash-tool')
    const { Bash } = await import('just-bash')

    const env = new Bash({
      python: true,
    })

    const toolkit = await createBashTool({
      sandbox: env,
      files: {
        '.bashrc': '',
      },
    })

    return toolkit
  }

  /**
   * Get or create sandbox for a chat (lazy initialization)
   */
  private async getOrCreateSandbox(chatId: string): Promise<BashToolkit> {
    const existing = this.sandboxes.get(chatId)
    if (existing) {
      existing.lastActivityAt = new Date()
      return existing.toolkit
    }

    // Check if sandbox is being created
    const pending = this.pendingCreation.get(chatId)
    if (pending) {
      return pending
    }

    // Create new sandbox
    const creationPromise = this.createSandbox().then(toolkit => {
      this.sandboxes.set(chatId, {
        toolkit,
        lastActivityAt: new Date(),
      })
      this.pendingCreation.delete(chatId)
      return toolkit
    })

    this.pendingCreation.set(chatId, creationPromise)
    return creationPromise
  }

  /**
   * Get sandbox tools with lazy initialization wrapper
   * Returns proxy that creates sandbox on first tool call
   */
  getSandboxTools(chatId: string): Record<string, ToolConfig> {
    const getToolkit = async (): Promise<BashToolkit> => {
      return this.getOrCreateSandbox(chatId)
    }

    return {
      bash: {
        name: 'bash',
        description: 'Execute bash commands in a sandboxed environment',
        inputSchema: z.object({
          command: z.string().describe('The bash command to execute'),
        }),
        execute: async (args: unknown) => {
          const toolkit = (await getToolkit()) as { tools: { bash: { execute: (args: unknown) => Promise<unknown> } } }
          return toolkit.tools.bash.execute(args)
        },
      } as ToolConfig,
      readFile: {
        name: 'readFile',
        description: 'Read a file from the sandbox',
        inputSchema: z.object({
          path: z.string().describe('The path to the file'),
        }),
        execute: async (args: unknown) => {
          const toolkit = (await getToolkit()) as {
            tools: { readFile: { execute: (args: unknown) => Promise<unknown> } }
          }
          return toolkit.tools.readFile.execute(args)
        },
      } as ToolConfig,
      writeFile: {
        name: 'writeFile',
        description: 'Write a file to the sandbox',
        inputSchema: z.object({
          path: z.string().describe('The path to the file'),
          content: z.string().describe('The content to write'),
        }),
        execute: async (args: unknown) => {
          const toolkit = (await getToolkit()) as {
            tools: { writeFile: { execute: (args: unknown) => Promise<unknown> } }
          }
          return toolkit.tools.writeFile.execute(args)
        },
      } as ToolConfig,
    }
  }

  /**
   * Remove a sandbox for a specific chat
   */
  removeSandbox(chatId: string): void {
    this.sandboxes.delete(chatId)
  }

  /**
   * Clean up inactive sandboxes
   */
  private cleanupInactiveSandboxes(): void {
    const now = new Date()

    for (const [chatId, entry] of this.sandboxes.entries()) {
      const inactiveMs = now.getTime() - entry.lastActivityAt.getTime()
      if (inactiveMs > this.maxInactiveMs) {
        this.sandboxes.delete(chatId)
      }
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSandboxes()
    }, this.cleanupIntervalMs)
  }

  /**
   * Stop cleanup interval
   */
  private stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Clean up all sandboxes
   */
  onModuleDestroy(): void {
    this.stopCleanupInterval()
    this.sandboxes.clear()
    this.pendingCreation.clear()
  }

  /**
   * Get stats about active sandboxes
   */
  getStats(): { total: number; chatIds: string[] } {
    return {
      total: this.sandboxes.size,
      chatIds: Array.from(this.sandboxes.keys()),
    }
  }
}
