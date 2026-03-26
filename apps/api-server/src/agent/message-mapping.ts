import type { Part } from '@repo/database'
import type { ProviderMetadata, UIMessage } from 'ai'

// Database part input type (without id and createdAt)
// Using unknown to bypass strict JsonValue type checking from Prisma

type DBPartInput = Omit<Part, 'id' | 'createdAt' | 'toolInput' | 'toolOutput' | 'dataPayload' | 'providerMetadata'> & {
  toolInput: unknown
  toolOutput: unknown
  dataPayload: unknown
  providerMetadata: unknown
} & Record<string, any>

/**
 * Map UIMessage parts to database Part format
 * Each part type is mapped to its corresponding database columns
 *
 * Reference: ai-sdk-persistence-db/lib/utils/message-mapping.ts
 * Adapted to use generic column structure instead of tool-specific columns
 */
export function mapUIMessagePartsToDBParts(parts: UIMessage['parts'], messageId: string): DBPartInput[] {
  return parts.map((part, index): DBPartInput => {
    switch (part.type) {
      case 'text':
        return {
          messageId,
          order: index,
          type: 'text',
          textContent: part.text,
          textState: part.state ?? null,
          reasoningContent: null,
          reasoningState: null,
          fileMediaType: null,
          fileUrl: null,
          fileFilename: null,
          sourceUrlSourceId: null,
          sourceUrlUrl: null,
          sourceUrlTitle: null,
          sourceDocumentSourceId: null,
          sourceDocumentMediaType: null,
          sourceDocumentTitle: null,
          sourceDocumentFilename: null,
          toolCallId: null,
          toolName: null,
          toolState: null,
          toolInput: null,
          toolOutput: null,
          toolErrorText: null,
          toolProviderExecuted: null,
          dataType: null,
          dataId: null,
          dataPayload: null,
          providerMetadata: part.providerMetadata ?? null,
        }

      case 'reasoning':
        return {
          messageId,
          order: index,
          type: 'reasoning',
          textContent: null,
          textState: null,
          reasoningContent: part.text,
          reasoningState: part.state ?? null,
          fileMediaType: null,
          fileUrl: null,
          fileFilename: null,
          sourceUrlSourceId: null,
          sourceUrlUrl: null,
          sourceUrlTitle: null,
          sourceDocumentSourceId: null,
          sourceDocumentMediaType: null,
          sourceDocumentTitle: null,
          sourceDocumentFilename: null,
          toolCallId: null,
          toolName: null,
          toolState: null,
          toolInput: null,
          toolOutput: null,
          toolErrorText: null,
          toolProviderExecuted: null,
          dataType: null,
          dataId: null,
          dataPayload: null,
          providerMetadata: part.providerMetadata ?? null,
        }

      case 'file':
        return {
          messageId,
          order: index,
          type: 'file',
          textContent: null,
          textState: null,
          reasoningContent: null,
          reasoningState: null,
          fileMediaType: part.mediaType,
          fileUrl: part.url,
          fileFilename: part.filename ?? null,
          sourceUrlSourceId: null,
          sourceUrlUrl: null,
          sourceUrlTitle: null,
          sourceDocumentSourceId: null,
          sourceDocumentMediaType: null,
          sourceDocumentTitle: null,
          sourceDocumentFilename: null,
          toolCallId: null,
          toolName: null,
          toolState: null,
          toolInput: null,
          toolOutput: null,
          toolErrorText: null,
          toolProviderExecuted: null,
          dataType: null,
          dataId: null,
          dataPayload: null,
          providerMetadata: part.providerMetadata ?? null,
        }

      case 'source-url':
        return {
          messageId,
          order: index,
          type: 'source-url',
          textContent: null,
          textState: null,
          reasoningContent: null,
          reasoningState: null,
          fileMediaType: null,
          fileUrl: null,
          fileFilename: null,
          sourceUrlSourceId: part.sourceId,
          sourceUrlUrl: part.url,
          sourceUrlTitle: part.title ?? null,
          sourceDocumentSourceId: null,
          sourceDocumentMediaType: null,
          sourceDocumentTitle: null,
          sourceDocumentFilename: null,
          toolCallId: null,
          toolName: null,
          toolState: null,
          toolInput: null,
          toolOutput: null,
          toolErrorText: null,
          toolProviderExecuted: null,
          dataType: null,
          dataId: null,
          dataPayload: null,
          providerMetadata: part.providerMetadata ?? null,
        }

      case 'source-document':
        return {
          messageId,
          order: index,
          type: 'source-document',
          textContent: null,
          textState: null,
          reasoningContent: null,
          reasoningState: null,
          fileMediaType: null,
          fileUrl: null,
          fileFilename: null,
          sourceUrlSourceId: null,
          sourceUrlUrl: null,
          sourceUrlTitle: null,
          sourceDocumentSourceId: part.sourceId,
          sourceDocumentMediaType: part.mediaType,
          sourceDocumentTitle: part.title,
          sourceDocumentFilename: part.filename ?? null,
          toolCallId: null,
          toolName: null,
          toolState: null,
          toolInput: null,
          toolOutput: null,
          toolErrorText: null,
          toolProviderExecuted: null,
          dataType: null,
          dataId: null,
          dataPayload: null,
          providerMetadata: part.providerMetadata ?? null,
        }

      case 'step-start':
        return {
          messageId,
          order: index,
          type: 'step-start',
          textContent: null,
          textState: null,
          reasoningContent: null,
          reasoningState: null,
          fileMediaType: null,
          fileUrl: null,
          fileFilename: null,
          sourceUrlSourceId: null,
          sourceUrlUrl: null,
          sourceUrlTitle: null,
          sourceDocumentSourceId: null,
          sourceDocumentMediaType: null,
          sourceDocumentTitle: null,
          sourceDocumentFilename: null,
          toolCallId: null,
          toolName: null,
          toolState: null,
          toolInput: null,
          toolOutput: null,
          toolErrorText: null,
          toolProviderExecuted: null,
          dataType: null,
          dataId: null,
          dataPayload: null,
          providerMetadata: null,
        }

      // Handle tool parts - AI SDK v6 uses `tool-${name}` format
      // We store them as 'tool' type with toolName field
      case 'dynamic-tool':
        return {
          messageId,
          order: index,
          type: 'tool',
          textContent: null,
          textState: null,
          reasoningContent: null,
          reasoningState: null,
          fileMediaType: null,
          fileUrl: null,
          fileFilename: null,
          sourceUrlSourceId: null,
          sourceUrlUrl: null,
          sourceUrlTitle: null,
          sourceDocumentSourceId: null,
          sourceDocumentMediaType: null,
          sourceDocumentTitle: null,
          sourceDocumentFilename: null,
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          toolState: part.state,
          toolInput:
            part.state === 'input-available' ||
            part.state === 'output-available' ||
            part.state === 'output-error' ||
            part.state === 'approval-requested' ||
            part.state === 'approval-responded'
              ? (part.input as Record<string, unknown>)
              : null,
          toolOutput: part.state === 'output-available' ? (part.output as Record<string, unknown>) : null,
          toolErrorText: part.state === 'output-error' ? part.errorText : null,
          toolProviderExecuted: part.providerExecuted ?? null,
          dataType: null,
          dataId: null,
          dataPayload: null,
          providerMetadata: null,
        }

      // Handle data parts - AI SDK v6 uses `data-${name}` format
      // We store them as 'data' type with dataType field
      default: {
        // Check if it's a tool part (format: tool-${name})
        if (part.type.startsWith('tool-')) {
          const toolPart = part as {
            type: string
            toolCallId: string
            state: string
            input?: Record<string, unknown>
            output?: Record<string, unknown>
            errorText?: string
            providerExecuted?: boolean
            providerMetadata?: Record<string, Record<string, unknown>>
          }
          return {
            messageId,
            order: index,
            type: 'tool',
            textContent: null,
            textState: null,
            reasoningContent: null,
            reasoningState: null,
            fileMediaType: null,
            fileUrl: null,
            fileFilename: null,
            sourceUrlSourceId: null,
            sourceUrlUrl: null,
            sourceUrlTitle: null,
            sourceDocumentSourceId: null,
            sourceDocumentMediaType: null,
            sourceDocumentTitle: null,
            sourceDocumentFilename: null,
            toolCallId: toolPart.toolCallId,
            toolName: part.type.slice(5), // Extract tool name from 'tool-${name}'
            toolState: toolPart.state,
            toolInput:
              toolPart.state === 'input-available' ||
              toolPart.state === 'output-available' ||
              toolPart.state === 'output-error'
                ? ((toolPart.input as Record<string, unknown>) ?? null)
                : null,
            toolOutput:
              toolPart.state === 'output-available' ? ((toolPart.output as Record<string, unknown>) ?? null) : null,
            toolErrorText: toolPart.state === 'output-error' ? (toolPart.errorText ?? null) : null,
            toolProviderExecuted: toolPart.providerExecuted ?? null,
            dataType: null,
            dataId: null,
            dataPayload: null,
            providerMetadata: (toolPart.providerMetadata as unknown) ?? null,
          }
        }

        // Check if it's a data part (format: data-${name})
        if (part.type.startsWith('data-')) {
          const dataPart = part as {
            type: string
            id?: string
            data: unknown
          }
          return {
            messageId,
            order: index,
            type: 'data',
            textContent: null,
            textState: null,
            reasoningContent: null,
            reasoningState: null,
            fileMediaType: null,
            fileUrl: null,
            fileFilename: null,
            sourceUrlSourceId: null,
            sourceUrlUrl: null,
            sourceUrlTitle: null,
            sourceDocumentSourceId: null,
            sourceDocumentMediaType: null,
            sourceDocumentTitle: null,
            sourceDocumentFilename: null,
            toolCallId: null,
            toolName: null,
            toolState: null,
            toolInput: null,
            toolOutput: null,
            toolErrorText: null,
            toolProviderExecuted: null,
            dataType: part.type.slice(5), // Extract data type from 'data-${name}'
            dataId: dataPart.id ?? null,
            dataPayload: dataPart.data,
            providerMetadata: null,
          }
        }

        throw new Error(`Unsupported part type: ${part.type}`)
      }
    }
  })
}

/**
 * Map database Part to UIMessage part format
 * Each part type is reconstructed from its corresponding database columns
 *
 * Reference: ai-sdk-persistence-db/lib/utils/message-mapping.ts
 * Adapted to use generic column structure
 */
export function mapDBPartToUIMessagePart(part: Part): UIMessage['parts'][number] {
  switch (part.type) {
    case 'text':
      return {
        type: 'text',
        text: part.textContent ?? '',
        state: part.textState as 'streaming' | 'done' | undefined,
      }

    case 'reasoning':
      return {
        type: 'reasoning',
        text: part.reasoningContent ?? '',
        state: part.reasoningState as 'streaming' | 'done' | undefined,
      }

    case 'file':
      return {
        type: 'file',
        mediaType: part.fileMediaType ?? '',
        filename: part.fileFilename ?? undefined,
        url: part.fileUrl ?? '',
      }

    case 'source-document':
      return {
        type: 'source-document',
        sourceId: part.sourceDocumentSourceId ?? '',
        mediaType: part.sourceDocumentMediaType ?? '',
        title: part.sourceDocumentTitle ?? '',
        filename: part.sourceDocumentFilename ?? undefined,
      }

    case 'source-url':
      return {
        type: 'source-url',
        sourceId: part.sourceUrlSourceId ?? '',
        url: part.sourceUrlUrl ?? '',
        title: part.sourceUrlTitle ?? undefined,
      }

    case 'step-start':
      return {
        type: 'step-start',
      }

    case 'tool': {
      if (!part.toolState) {
        throw new Error('Tool state is undefined')
      }

      const toolName = part.toolName!
      const baseToolPart = {
        toolCallId: part.toolCallId!,
        toolName,
        providerExecuted: part.toolProviderExecuted ?? undefined,
      }

      // Map database state to UIMessage state
      // Note: AI SDK v6 uses `tool-${name}` as the type
      const toolType = `tool-${toolName}` as const

      switch (part.toolState) {
        case 'input-streaming':
          return {
            type: toolType,
            ...baseToolPart,
            state: 'input-streaming' as const,
            input: part.toolInput as Record<string, unknown> | undefined,
          }
        case 'input-available':
          return {
            type: toolType,
            ...baseToolPart,
            state: 'input-available' as const,
            input: part.toolInput as Record<string, unknown>,
          }
        case 'output-available':
          return {
            type: toolType,
            ...baseToolPart,
            state: 'output-available' as const,
            input: part.toolInput as Record<string, unknown>,
            output: part.toolOutput as Record<string, unknown>,
          }
        case 'output-error':
          return {
            type: toolType,
            ...baseToolPart,
            state: 'output-error' as const,
            input: part.toolInput as Record<string, unknown>,
            errorText: part.toolErrorText!,
          }
        case 'approval-requested':
          return {
            type: toolType,
            ...baseToolPart,
            state: 'approval-requested' as const,
            input: part.toolInput as Record<string, unknown>,
            approval: { id: part.toolCallId! },
          }
        case 'approval-responded':
          return {
            type: toolType,
            ...baseToolPart,
            state: 'approval-responded' as const,
            input: part.toolInput as Record<string, unknown>,
            approval: { id: part.toolCallId!, approved: false },
          }
        default:
          // Fallback to input-available if state is unknown
          return {
            type: toolType,
            ...baseToolPart,
            state: 'input-available' as const,
            input: (part.toolInput as Record<string, unknown>) ?? {},
          }
      }
    }

    case 'data': {
      const dataType = part.dataType!
      return {
        type: `data-${dataType}` as const,
        id: part.dataId ?? undefined,
        data: part.dataPayload,
      }
    }

    default:
      throw new Error(`Unsupported part type: ${(part as { type: string }).type}`)
  }
}

/**
 * Map database Message with Parts to UIMessage format
 */
export function mapDBMessageToUIMessage(message: { id: string; role: string; parts: Part[] }): UIMessage {
  return {
    id: message.id,
    role: message.role as 'system' | 'user' | 'assistant',
    parts: message.parts.sort((a, b) => a.order - b.order).map(mapDBPartToUIMessagePart),
  }
}

/**
 * Convert ModelMessage content to UIMessage parts
 * Used when AI SDK returns ModelMessage instead of UIMessage
 */
export function convertModelContentToParts(content: unknown): UIMessage['parts'] {
  const parts: UIMessage['parts'] = []

  if (typeof content === 'string') {
    parts.push({ type: 'text', text: content })
  } else if (Array.isArray(content)) {
    for (const item of content) {
      if (typeof item === 'object' && item !== null) {
        const typedItem = item as { type: string }

        switch (typedItem.type) {
          case 'text': {
            const textItem = item as { text: string; providerMetadata?: ProviderMetadata }
            parts.push({
              type: 'text',
              text: textItem.text,
              providerMetadata: textItem.providerMetadata,
            })
            break
          }

          case 'tool-call': {
            const toolCall = item as {
              toolCallId: string
              toolName: string
              args: Record<string, unknown>
              providerMetadata?: Record<string, Record<string, unknown>>
            }
            parts.push({
              type: `tool-${toolCall.toolName}` as const,
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName,
              state: 'input-available',
              input: toolCall.args,
              providerMetadata: toolCall.providerMetadata,
            } as UIMessage['parts'][number])
            break
          }

          case 'tool-result': {
            const toolResult = item as {
              toolCallId: string
              toolName: string
              result: unknown
              providerExecuted?: boolean
              providerMetadata?: Record<string, Record<string, unknown>>
            }
            parts.push({
              type: `tool-${toolResult.toolName}` as const,
              toolCallId: toolResult.toolCallId,
              toolName: toolResult.toolName,
              state: 'output-available',
              input: {}, // Tool result doesn't include input, we'd need to look it up
              output: toolResult.result as Record<string, unknown>,
              providerExecuted: toolResult.providerExecuted,
              providerMetadata: toolResult.providerMetadata,
            } as UIMessage['parts'][number])
            break
          }

          default:
            // Skip unknown types
            break
        }
      }
    }
  }

  return parts
}
