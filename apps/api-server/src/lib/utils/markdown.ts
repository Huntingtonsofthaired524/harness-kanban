import { defaultMarkdownSerializer, schema as mdSchema } from 'prosemirror-markdown'
import { Node } from 'prosemirror-model'

import { JSONContent } from '@tiptap/core'

const PM_TO_MARKDOWN_TYPEMAP: Record<string, string> = {
  orderedList: 'ordered_list',
  bulletList: 'bullet_list',
  listItem: 'list_item',
  codeBlock: 'code_block',
}

const normalizeNodeTypes = (node: JSONContent): JSONContent => {
  if (Array.isArray(node.content)) {
    node.content = node.content.map(normalizeNodeTypes)
  }

  const mappedType = PM_TO_MARKDOWN_TYPEMAP[node.type as string] || node.type

  return {
    ...node,
    type: mappedType,
    content: node.content,
  }
}

export const jsonContentToMarkdown = (jsonStr: string): string => {
  const docJSON = JSON.parse(jsonStr) as JSONContent
  // looks like some doc types from some tiptap extensions don't match the prosemirror-markdown schema
  // so we manually fix them
  const normalizedJSON = normalizeNodeTypes(docJSON)
  const pmDoc = Node.fromJSON(mdSchema, normalizedJSON)

  const mdText = defaultMarkdownSerializer.serialize(pmDoc)
  return mdText
}
