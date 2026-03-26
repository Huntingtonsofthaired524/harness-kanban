import {
  convertModelContentToParts,
  mapDBMessageToUIMessage,
  mapDBPartToUIMessagePart,
  mapUIMessagePartsToDBParts,
} from '../message-mapping'
import type { Part } from '@repo/database'
import type { UIMessage } from 'ai'

describe('message-mapping', () => {
  describe('mapUIMessagePartsToDBParts', () => {
    const messageId = 'msg-1'

    it('should map text part to DB format', () => {
      const parts: UIMessage['parts'] = [{ type: 'text', text: 'Hello world', state: 'done' }]

      const result = mapUIMessagePartsToDBParts(parts, messageId)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        messageId,
        order: 0,
        type: 'text',
        textContent: 'Hello world',
        textState: 'done',
      })
      expect(result[0].reasoningContent).toBeNull()
    })

    it('should map text part without state', () => {
      const parts: UIMessage['parts'] = [{ type: 'text', text: 'Plain text' }]

      const result = mapUIMessagePartsToDBParts(parts, messageId)

      expect(result[0].textState).toBeNull()
    })

    it('should map reasoning part to DB format', () => {
      const parts: UIMessage['parts'] = [{ type: 'reasoning', text: 'Thinking...', state: 'streaming' }]

      const result = mapUIMessagePartsToDBParts(parts, messageId)

      expect(result[0]).toMatchObject({
        type: 'reasoning',
        reasoningContent: 'Thinking...',
        reasoningState: 'streaming',
      })
    })

    it('should map file part to DB format', () => {
      const parts: UIMessage['parts'] = [
        {
          type: 'file',
          mediaType: 'image/png',
          url: 'https://example.com/image.png',
          filename: 'image.png',
        },
      ]

      const result = mapUIMessagePartsToDBParts(parts, messageId)

      expect(result[0]).toMatchObject({
        type: 'file',
        fileMediaType: 'image/png',
        fileUrl: 'https://example.com/image.png',
        fileFilename: 'image.png',
      })
    })

    it('should map source-url part to DB format', () => {
      const parts: UIMessage['parts'] = [
        {
          type: 'source-url',
          sourceId: 'source-1',
          url: 'https://example.com',
          title: 'Example Site',
        },
      ]

      const result = mapUIMessagePartsToDBParts(parts, messageId)

      expect(result[0]).toMatchObject({
        type: 'source-url',
        sourceUrlSourceId: 'source-1',
        sourceUrlUrl: 'https://example.com',
        sourceUrlTitle: 'Example Site',
      })
    })

    it('should map source-document part to DB format', () => {
      const parts: UIMessage['parts'] = [
        {
          type: 'source-document',
          sourceId: 'doc-1',
          mediaType: 'application/pdf',
          title: 'Document',
          filename: 'doc.pdf',
        },
      ]

      const result = mapUIMessagePartsToDBParts(parts, messageId)

      expect(result[0]).toMatchObject({
        type: 'source-document',
        sourceDocumentSourceId: 'doc-1',
        sourceDocumentMediaType: 'application/pdf',
        sourceDocumentTitle: 'Document',
        sourceDocumentFilename: 'doc.pdf',
      })
    })

    it('should map step-start part to DB format', () => {
      const parts: UIMessage['parts'] = [{ type: 'step-start' }]

      const result = mapUIMessagePartsToDBParts(parts, messageId)

      expect(result[0]).toMatchObject({
        type: 'step-start',
        textContent: null,
      })
    })

    it('should map dynamic-tool part with input-available state', () => {
      const parts: UIMessage['parts'] = [
        {
          type: 'dynamic-tool',
          toolCallId: 'call-1',
          toolName: 'searchTool',
          state: 'input-available',
          input: { query: 'test' },
        },
      ]

      const result = mapUIMessagePartsToDBParts(parts, messageId)

      expect(result[0]).toMatchObject({
        type: 'tool',
        toolCallId: 'call-1',
        toolName: 'searchTool',
        toolState: 'input-available',
        toolInput: { query: 'test' },
        toolOutput: null,
      })
    })

    it('should map dynamic-tool part with output-available state', () => {
      const parts: UIMessage['parts'] = [
        {
          type: 'dynamic-tool',
          toolCallId: 'call-1',
          toolName: 'searchTool',
          state: 'output-available',
          input: { query: 'test' },
          output: { results: ['a', 'b'] },
        },
      ]

      const result = mapUIMessagePartsToDBParts(parts, messageId)

      expect(result[0]).toMatchObject({
        toolState: 'output-available',
        toolInput: { query: 'test' },
        toolOutput: { results: ['a', 'b'] },
      })
    })

    it('should map dynamic-tool part with output-error state', () => {
      const parts: UIMessage['parts'] = [
        {
          type: 'dynamic-tool',
          toolCallId: 'call-1',
          toolName: 'searchTool',
          state: 'output-error',
          input: { query: 'test' },
          errorText: 'Error occurred',
        },
      ]

      const result = mapUIMessagePartsToDBParts(parts, messageId)

      expect(result[0]).toMatchObject({
        toolState: 'output-error',
        toolErrorText: 'Error occurred',
      })
    })

    it('should map tool-${name} part to DB format', () => {
      const parts = [
        {
          type: 'tool-customTool' as const,
          toolCallId: 'call-1',
          state: 'input-available',
          input: { arg: 'value' },
        },
      ]

      const result = mapUIMessagePartsToDBParts(parts as UIMessage['parts'], messageId)

      expect(result[0]).toMatchObject({
        type: 'tool',
        toolName: 'customTool',
        toolState: 'input-available',
      })
    })

    it('should map data-${name} part to DB format', () => {
      const parts = [
        {
          type: 'data-customData' as const,
          id: 'data-1',
          data: { key: 'value' },
        },
      ]

      const result = mapUIMessagePartsToDBParts(parts as UIMessage['parts'], messageId)

      expect(result[0]).toMatchObject({
        type: 'data',
        dataType: 'customData',
        dataId: 'data-1',
        dataPayload: { key: 'value' },
      })
    })

    it('should assign correct order to multiple parts', () => {
      const parts: UIMessage['parts'] = [
        { type: 'text', text: 'First' },
        { type: 'text', text: 'Second' },
        { type: 'step-start' },
      ]

      const result = mapUIMessagePartsToDBParts(parts, messageId)

      expect(result[0].order).toBe(0)
      expect(result[1].order).toBe(1)
      expect(result[2].order).toBe(2)
    })

    it('should throw error for unsupported part type', () => {
      const parts = [{ type: 'unknown-type' }] as unknown as UIMessage['parts']

      expect(() => mapUIMessagePartsToDBParts(parts, messageId)).toThrow('Unsupported part type: unknown-type')
    })
  })

  describe('mapDBPartToUIMessagePart', () => {
    it('should map text part to UIMessage format', () => {
      const part = {
        type: 'text',
        textContent: 'Hello',
        textState: 'done',
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toEqual({
        type: 'text',
        text: 'Hello',
        state: 'done',
      })
    })

    it('should map reasoning part to UIMessage format', () => {
      const part = {
        type: 'reasoning',
        reasoningContent: 'Thinking...',
        reasoningState: 'streaming',
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toEqual({
        type: 'reasoning',
        text: 'Thinking...',
        state: 'streaming',
      })
    })

    it('should map file part to UIMessage format', () => {
      const part = {
        type: 'file',
        fileMediaType: 'image/png',
        fileUrl: 'https://example.com/img.png',
        fileFilename: 'img.png',
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toEqual({
        type: 'file',
        mediaType: 'image/png',
        url: 'https://example.com/img.png',
        filename: 'img.png',
      })
    })

    it('should map source-url part to UIMessage format', () => {
      const part = {
        type: 'source-url',
        sourceUrlSourceId: 'src-1',
        sourceUrlUrl: 'https://example.com',
        sourceUrlTitle: 'Example',
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toEqual({
        type: 'source-url',
        sourceId: 'src-1',
        url: 'https://example.com',
        title: 'Example',
      })
    })

    it('should map source-document part to UIMessage format', () => {
      const part = {
        type: 'source-document',
        sourceDocumentSourceId: 'doc-1',
        sourceDocumentMediaType: 'application/pdf',
        sourceDocumentTitle: 'My Doc',
        sourceDocumentFilename: 'doc.pdf',
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toEqual({
        type: 'source-document',
        sourceId: 'doc-1',
        mediaType: 'application/pdf',
        title: 'My Doc',
        filename: 'doc.pdf',
      })
    })

    it('should map step-start part to UIMessage format', () => {
      const part = { type: 'step-start' } as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toEqual({ type: 'step-start' })
    })

    it('should map tool part with input-streaming state', () => {
      const part = {
        type: 'tool',
        toolName: 'searchTool',
        toolCallId: 'call-1',
        toolState: 'input-streaming',
        toolInput: { query: 'test' },
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toEqual({
        type: 'tool-searchTool',
        toolCallId: 'call-1',
        toolName: 'searchTool',
        state: 'input-streaming',
        input: { query: 'test' },
      })
    })

    it('should map tool part with input-available state', () => {
      const part = {
        type: 'tool',
        toolName: 'myTool',
        toolCallId: 'call-1',
        toolState: 'input-available',
        toolInput: { arg: 'value' },
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toMatchObject({
        type: 'tool-myTool',
        state: 'input-available',
        input: { arg: 'value' },
      })
    })

    it('should map tool part with output-available state', () => {
      const part = {
        type: 'tool',
        toolName: 'myTool',
        toolCallId: 'call-1',
        toolState: 'output-available',
        toolInput: { arg: 'value' },
        toolOutput: { result: 'success' },
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toMatchObject({
        state: 'output-available',
        input: { arg: 'value' },
        output: { result: 'success' },
      })
    })

    it('should map tool part with output-error state', () => {
      const part = {
        type: 'tool',
        toolName: 'myTool',
        toolCallId: 'call-1',
        toolState: 'output-error',
        toolInput: { arg: 'value' },
        toolErrorText: 'Something went wrong',
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toMatchObject({
        state: 'output-error',
        errorText: 'Something went wrong',
      })
    })

    it('should map tool part with approval-requested state', () => {
      const part = {
        type: 'tool',
        toolName: 'myTool',
        toolCallId: 'call-1',
        toolState: 'approval-requested',
        toolInput: { arg: 'value' },
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toMatchObject({
        state: 'approval-requested',
        approval: { id: 'call-1' },
      })
    })

    it('should map tool part with approval-responded state', () => {
      const part = {
        type: 'tool',
        toolName: 'myTool',
        toolCallId: 'call-1',
        toolState: 'approval-responded',
        toolInput: { arg: 'value' },
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toMatchObject({
        state: 'approval-responded',
        approval: { id: 'call-1', approved: false },
      })
    })

    it('should fallback to input-available for unknown tool state', () => {
      const part = {
        type: 'tool',
        toolName: 'myTool',
        toolCallId: 'call-1',
        toolState: 'unknown-state',
        toolInput: { arg: 'value' },
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toMatchObject({
        state: 'input-available',
        input: { arg: 'value' },
      })
    })

    it('should throw error when tool state is undefined', () => {
      const part = {
        type: 'tool',
        toolName: 'myTool',
        toolCallId: 'call-1',
        toolState: null,
      } as unknown as Part

      expect(() => mapDBPartToUIMessagePart(part)).toThrow('Tool state is undefined')
    })

    it('should map data part to UIMessage format', () => {
      const part = {
        type: 'data',
        dataType: 'customData',
        dataId: 'data-1',
        dataPayload: { key: 'value' },
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toEqual({
        type: 'data-customData',
        id: 'data-1',
        data: { key: 'value' },
      })
    })

    it('should map data part without id', () => {
      const part = {
        type: 'data',
        dataType: 'simpleData',
        dataId: null,
        dataPayload: 'payload',
      } as unknown as Part

      const result = mapDBPartToUIMessagePart(part)

      expect(result).toEqual({
        type: 'data-simpleData',
        data: 'payload',
      })
      expect((result as { id?: string }).id).toBeUndefined()
    })

    it('should throw error for unsupported part type', () => {
      const part = { type: 'unknown' } as Part

      expect(() => mapDBPartToUIMessagePart(part)).toThrow('Unsupported part type: unknown')
    })
  })

  describe('mapDBMessageToUIMessage', () => {
    it('should map DB message with parts to UIMessage', () => {
      const message = {
        id: 'msg-1',
        role: 'user',
        parts: [
          { type: 'text', textContent: 'Hello', order: 1 } as Part,
          { type: 'text', textContent: 'World', order: 0 } as Part,
        ],
      }

      const result = mapDBMessageToUIMessage(message)

      expect(result.id).toBe('msg-1')
      expect(result.role).toBe('user')
      expect(result.parts).toHaveLength(2)
      expect(result.parts[0]).toEqual({ type: 'text', text: 'World' })
      expect(result.parts[1]).toEqual({ type: 'text', text: 'Hello' })
    })

    it('should sort parts by order', () => {
      const message = {
        id: 'msg-1',
        role: 'assistant',
        parts: [
          { type: 'text', textContent: 'Third', order: 2 } as Part,
          { type: 'text', textContent: 'First', order: 0 } as Part,
          { type: 'text', textContent: 'Second', order: 1 } as Part,
        ],
      }

      const result = mapDBMessageToUIMessage(message)

      const texts = result.parts.map(p => (p as { text: string }).text)
      expect(texts).toEqual(['First', 'Second', 'Third'])
    })
  })

  describe('convertModelContentToParts', () => {
    it('should convert string content to text part', () => {
      const result = convertModelContentToParts('Hello world')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'text',
        text: 'Hello world',
      })
    })

    it('should convert array with text items', () => {
      const content = [
        { type: 'text', text: 'First' },
        { type: 'text', text: 'Second', providerMetadata: { custom: { key: 'value' } } },
      ]

      const result = convertModelContentToParts(content)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ type: 'text', text: 'First' })
      expect(result[1]).toEqual({
        type: 'text',
        text: 'Second',
        providerMetadata: { custom: { key: 'value' } },
      })
    })

    it('should convert tool-call items', () => {
      const content = [
        {
          type: 'tool-call',
          toolCallId: 'call-1',
          toolName: 'search',
          args: { query: 'test' },
          providerMetadata: { custom: { key: 'value' } },
        },
      ]

      const result = convertModelContentToParts(content)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        type: 'tool-search',
        toolCallId: 'call-1',
        toolName: 'search',
        state: 'input-available',
        input: { query: 'test' },
        providerMetadata: { custom: { key: 'value' } },
      })
    })

    it('should convert tool-result items', () => {
      const content = [
        {
          type: 'tool-result',
          toolCallId: 'call-1',
          toolName: 'search',
          result: { data: 'results' },
          providerExecuted: true,
        },
      ]

      const result = convertModelContentToParts(content)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        type: 'tool-search',
        toolCallId: 'call-1',
        toolName: 'search',
        state: 'output-available',
        input: {},
        output: { data: 'results' },
        providerExecuted: true,
      })
    })

    it('should skip unknown item types', () => {
      const content = [
        { type: 'text', text: 'Hello' },
        { type: 'unknown-type', data: 'value' },
        { type: 'text', text: 'World' },
      ]

      const result = convertModelContentToParts(content)

      expect(result).toHaveLength(2)
      expect((result[0] as { text: string }).text).toBe('Hello')
      expect((result[1] as { text: string }).text).toBe('World')
    })

    it('should handle empty array', () => {
      const result = convertModelContentToParts([])

      expect(result).toHaveLength(0)
    })

    it('should handle non-object items in array', () => {
      const content = ['string', 123, null, { type: 'text', text: 'Valid' }]

      const result = convertModelContentToParts(content)

      expect(result).toHaveLength(1)
      expect((result[0] as { text: string }).text).toBe('Valid')
    })
  })
})
