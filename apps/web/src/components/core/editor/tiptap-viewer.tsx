'use client'

import { cn } from '@/lib/shadcn/utils'
import { Image } from '@tiptap/extension-image'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export const TiptapViewer = ({ content, className = '' }: { content: string; className?: string }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: cn('max-w-[400px] w-full '),
        },
      }),
    ],
    content: (() => {
      try {
        return content ? JSON.parse(content) : ''
      } catch {
        return content
      }
    })(),
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-slate dark:prose-invert max-w-none overflow-y-scroll px-0 py-0 text-sm text-primary',
          'focus:outline-none scrollbar-hide',
          className,
        ),
      },
    },
    editable: false,
    immediatelyRender: false,
  })

  if (!editor) return null

  return <EditorContent editor={editor} />
}
