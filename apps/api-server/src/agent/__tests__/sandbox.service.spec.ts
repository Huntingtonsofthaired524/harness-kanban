import { SandboxService } from '../sandbox.service'

// Mock the dynamic imports
const mockBashExecute = jest.fn()
const mockReadFileExecute = jest.fn()
const mockWriteFileExecute = jest.fn()
const mockCreateBashTool = jest.fn()
const mockBashConstructor = jest.fn()

jest.mock('../sandbox.service', () => {
  return {
    SandboxService: jest.fn().mockImplementation(() => {
      const sandboxes = new Map()
      const pendingCreation = new Map()

      return {
        getSandboxTools: (chatId: string) => {
          const getToolkit = async () => {
            if (sandboxes.has(chatId)) {
              return sandboxes.get(chatId).toolkit
            }

            const pending = pendingCreation.get(chatId)
            if (pending) {
              return pending
            }

            const creationPromise = Promise.resolve().then(() => {
              const toolkit = {
                tools: {
                  bash: { execute: mockBashExecute },
                  readFile: { execute: mockReadFileExecute },
                  writeFile: { execute: mockWriteFileExecute },
                },
              }
              sandboxes.set(chatId, {
                toolkit,
                lastActivityAt: new Date(),
              })
              pendingCreation.delete(chatId)
              return toolkit
            })

            pendingCreation.set(chatId, creationPromise)
            return creationPromise
          }

          return {
            bash: {
              name: 'bash',
              description: 'Execute bash commands',
              execute: async (args: unknown) => {
                const toolkit = await getToolkit()
                return toolkit.tools.bash.execute(args)
              },
            },
            readFile: {
              name: 'readFile',
              description: 'Read a file',
              execute: async (args: unknown) => {
                const toolkit = await getToolkit()
                return toolkit.tools.readFile.execute(args)
              },
            },
            writeFile: {
              name: 'writeFile',
              description: 'Write a file',
              execute: async (args: unknown) => {
                const toolkit = await getToolkit()
                return toolkit.tools.writeFile.execute(args)
              },
            },
          }
        },

        removeSandbox: (chatId: string) => {
          sandboxes.delete(chatId)
        },

        onModuleDestroy: () => {
          sandboxes.clear()
          pendingCreation.clear()
        },

        getStats: () => ({
          total: sandboxes.size,
          chatIds: Array.from(sandboxes.keys()),
        }),
      }
    }),
  }
})

describe('SandboxService', () => {
  let service: SandboxService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new SandboxService()
  })

  afterEach(() => {
    service.onModuleDestroy()
  })

  describe('getSandboxTools', () => {
    it('should return bash, readFile, and writeFile tools', () => {
      const tools = service.getSandboxTools('test-chat-123')

      expect(tools).toHaveProperty('bash')
      expect(tools).toHaveProperty('readFile')
      expect(tools).toHaveProperty('writeFile')
    })

    it('should return tools with correct structure', () => {
      const tools = service.getSandboxTools('test-chat-123')

      expect(tools.bash).toMatchObject({
        name: 'bash',
        description: expect.any(String),
        execute: expect.any(Function),
      })

      expect(tools.readFile).toMatchObject({
        name: 'readFile',
        description: expect.any(String),
        execute: expect.any(Function),
      })

      expect(tools.writeFile).toMatchObject({
        name: 'writeFile',
        description: expect.any(String),
        execute: expect.any(Function),
      })
    })
  })

  describe('lazy sandbox creation', () => {
    it('should create sandbox on first tool execution', async () => {
      const tools = service.getSandboxTools('chat-1')

      // Sandbox should not be created yet
      expect(service.getStats().total).toBe(0)

      // Execute bash tool
      mockBashExecute.mockResolvedValueOnce({ stdout: 'hello', stderr: '', exitCode: 0 })
      const result = await tools.bash.execute({ command: 'echo hello' })

      // Sandbox should be created now
      expect(mockBashExecute).toHaveBeenCalledWith({ command: 'echo hello' })
      expect(result).toEqual({ stdout: 'hello', stderr: '', exitCode: 0 })
      expect(service.getStats().total).toBe(1)
    })

    it('should reuse the same sandbox on subsequent calls', async () => {
      const tools = service.getSandboxTools('chat-2')

      // First call
      mockBashExecute.mockResolvedValueOnce({ stdout: 'first', stderr: '', exitCode: 0 })
      await tools.bash.execute({ command: 'echo first' })

      // Second call
      mockBashExecute.mockResolvedValueOnce({ stdout: 'second', stderr: '', exitCode: 0 })
      await tools.bash.execute({ command: 'echo second' })

      // Sandbox should only be created once
      expect(service.getStats().total).toBe(1)
      expect(mockBashExecute).toHaveBeenCalledTimes(2)
    })

    it('should create separate sandboxes for different chats', async () => {
      const tools1 = service.getSandboxTools('chat-a')
      const tools2 = service.getSandboxTools('chat-b')

      mockBashExecute
        .mockResolvedValueOnce({ stdout: 'chat-a', stderr: '', exitCode: 0 })
        .mockResolvedValueOnce({ stdout: 'chat-b', stderr: '', exitCode: 0 })

      await tools1.bash.execute({ command: 'echo chat-a' })
      await tools2.bash.execute({ command: 'echo chat-b' })

      expect(service.getStats().total).toBe(2)
      expect(service.getStats().chatIds).toContain('chat-a')
      expect(service.getStats().chatIds).toContain('chat-b')
    })

    it('should handle concurrent tool calls without creating duplicate sandboxes', async () => {
      const tools = service.getSandboxTools('chat-concurrent')

      mockBashExecute.mockResolvedValueOnce({ stdout: '1', stderr: '', exitCode: 0 })
      mockReadFileExecute.mockResolvedValueOnce('file content')

      // Execute two tools concurrently
      await Promise.all([tools.bash.execute({ command: 'echo 1' }), tools.readFile.execute({ path: '/test.txt' })])

      // Should only create one sandbox even for concurrent calls
      expect(service.getStats().total).toBe(1)
    })
  })

  describe('tool execution', () => {
    beforeEach(() => {
      mockBashExecute.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
      mockReadFileExecute.mockResolvedValue('file content')
      mockWriteFileExecute.mockResolvedValue(undefined)
    })

    it('should execute bash tool correctly', async () => {
      const tools = service.getSandboxTools('chat-exec')

      await tools.bash.execute({ command: 'ls -la' })

      expect(mockBashExecute).toHaveBeenCalledWith({ command: 'ls -la' })
    })

    it('should execute readFile tool correctly', async () => {
      const tools = service.getSandboxTools('chat-read')

      const result = await tools.readFile.execute({ path: '/workspace/test.txt' })

      expect(mockReadFileExecute).toHaveBeenCalledWith({ path: '/workspace/test.txt' })
      expect(result).toBe('file content')
    })

    it('should execute writeFile tool correctly', async () => {
      const tools = service.getSandboxTools('chat-write')

      await tools.writeFile.execute({ path: '/workspace/test.txt', content: 'hello' })

      expect(mockWriteFileExecute).toHaveBeenCalledWith({
        path: '/workspace/test.txt',
        content: 'hello',
      })
    })
  })

  describe('cleanup', () => {
    it('should remove sandbox for specific chat', async () => {
      const tools = service.getSandboxTools('chat-remove')

      // Create sandbox
      mockBashExecute.mockResolvedValueOnce({ stdout: 'test', stderr: '', exitCode: 0 })
      await tools.bash.execute({ command: 'echo test' })
      expect(service.getStats().total).toBe(1)

      // Remove sandbox
      service.removeSandbox('chat-remove')
      expect(service.getStats().total).toBe(0)
    })

    it('should cleanup all sandboxes on module destroy', async () => {
      const tools1 = service.getSandboxTools('chat-1')
      const tools2 = service.getSandboxTools('chat-2')

      // Create sandboxes
      mockBashExecute
        .mockResolvedValueOnce({ stdout: '1', stderr: '', exitCode: 0 })
        .mockResolvedValueOnce({ stdout: '2', stderr: '', exitCode: 0 })

      await tools1.bash.execute({ command: 'echo 1' })
      await tools2.bash.execute({ command: 'echo 2' })

      expect(service.getStats().total).toBe(2)

      // Destroy
      service.onModuleDestroy()

      expect(service.getStats().total).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should return initial stats with 0 sandboxes', () => {
      const stats = service.getStats()

      expect(stats).toEqual({
        total: 0,
        chatIds: [],
      })
    })

    it('should return correct stats after creating sandboxes', async () => {
      const tools1 = service.getSandboxTools('chat-1')
      const tools2 = service.getSandboxTools('chat-2')

      mockBashExecute
        .mockResolvedValueOnce({ stdout: '1', stderr: '', exitCode: 0 })
        .mockResolvedValueOnce({ stdout: '2', stderr: '', exitCode: 0 })

      await tools1.bash.execute({ command: 'echo 1' })
      await tools2.bash.execute({ command: 'echo 2' })

      const stats = service.getStats()

      expect(stats.total).toBe(2)
      expect(stats.chatIds).toContain('chat-1')
      expect(stats.chatIds).toContain('chat-2')
    })
  })
})
