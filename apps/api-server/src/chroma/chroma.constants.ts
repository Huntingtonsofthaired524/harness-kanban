export const CHROMA_CLIENT_TOKEN = Symbol('CHROMA_CLIENT_TOKEN')

export const DEFAULT_CHROMA_HOST = 'localhost'
export const DEFAULT_CHROMA_PORT = 8000
export const DEFAULT_CHROMA_OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small'

export const CHROMA_COLLECTIONS = {
  ISSUES: 'harness_kanban_issues',
} as const

export type ChromaCollectionName = (typeof CHROMA_COLLECTIONS)[keyof typeof CHROMA_COLLECTIONS]
