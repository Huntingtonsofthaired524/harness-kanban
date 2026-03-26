import { toast } from 'sonner'
import React, { useRef, useState } from 'react'

import { TiptapEditor, TiptapEditorHandle } from '@/components/core/editor/tiptap-editor'
import { Button } from '@/components/ui/button'
import { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof TiptapEditor> = {
  title: 'Core/TiptapEditor',
  component: TiptapEditor,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div style={{ width: '600px', minHeight: '400px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof TiptapEditor>

// Mock upload function for stories
const mockUploadImage = async (base64: string): Promise<string> => {
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  // Return a placeholder URL
  return 'https://via.placeholder.com/400x300?text=Uploaded+Image'
}

// Helper function to format JSON content
const formatJsonContent = (content: string) => {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content)
    return JSON.stringify(parsed, null, 2)
  } catch {
    // If not valid JSON, return as-is
    return content
  }
}

// JSON Display Component
const JsonDisplay: React.FC<{ content: string; label?: string }> = ({ content, label = 'Current content' }) => (
  <div className="text-muted-foreground text-sm">
    <strong>{label}:</strong>
    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-gray-100 p-2 font-mono text-xs leading-relaxed">
      {formatJsonContent(content)}
    </pre>
  </div>
)

// Basic editable story
export const Basic: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <div className="border-border rounded-md border p-4">
        <TiptapEditor
          value={value}
          onUpdate={setValue}
          editable
          placeholder="Write a comment..."
          className="min-h-32"
        />
      </div>
    )
  },
}

// Story with content and update tracking
export const WithContent: Story = {
  render: () => {
    const [value, setValue] = useState(
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This is some "},{"type":"text","marks":[{"type":"bold"}],"text":"initial content"},{"type":"text","text":" with formatting."}]}]}',
    )
    return (
      <div className="space-y-4">
        <div className="border-border rounded-md border p-4">
          <TiptapEditor
            value={value}
            onUpdate={val => {
              setValue(val)
              toast.info('Content updated')
            }}
            editable
            placeholder="Write a comment..."
            className="min-h-32"
          />
        </div>
        <JsonDisplay content={value} />
      </div>
    )
  },
}

// Read-only story
export const ReadOnly: Story = {
  render: () => (
    <div className="border-border rounded-md border p-4">
      <TiptapEditor
        value="<p>This is a <em>read-only</em> comment that cannot be edited.</p><ul><li>Item 1</li><li>Item 2</li></ul>"
        editable={false}
        className="min-h-32"
      />
    </div>
  ),
}

// Story with external save button
export const WithSaveButton: Story = {
  render: () => {
    const [value, setValue] = useState('')
    const [savedValue, setSavedValue] = useState('')
    const editorRef = useRef<TiptapEditorHandle>(null)

    const handleSave = () => {
      const currentValue = editorRef.current?.getValue() ?? ''
      setSavedValue(currentValue)
      toast.success(`Comment saved: ${currentValue.length} characters`)
    }

    return (
      <div className="space-y-4">
        <div className="border-border relative rounded-md border p-4">
          <TiptapEditor
            ref={editorRef}
            value={value}
            onUpdate={setValue}
            editable
            placeholder="Write a comment..."
            className="min-h-32"
          />
          <div className="absolute bottom-2 right-2">
            <Button onClick={handleSave} disabled={!value.trim()}>
              Save Comment
            </Button>
          </div>
        </div>
        {savedValue && <JsonDisplay content={savedValue} label="Last saved" />}
      </div>
    )
  },
}

// Story with image upload functionality
export const WithImageUpload: Story = {
  render: () => {
    const [value, setValue] = useState(
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Try pasting an image or using the slash commands!"}]}]}',
    )
    return (
      <div className="space-y-4">
        <div className="border-border rounded-md border p-4">
          <TiptapEditor
            value={value}
            onUpdate={setValue}
            editable
            placeholder="Write a comment with images..."
            className="min-h-32"
            uploadImage={mockUploadImage}
          />
          <div className="text-muted-foreground mt-2 text-xs">
            Tip: Try typing "/" for slash commands or paste an image
          </div>
        </div>
        <JsonDisplay content={value} />
      </div>
    )
  },
}

// Story with blur handling
export const WithBlurSave: Story = {
  render: () => {
    const [value, setValue] = useState('')
    const currentValueRef = useRef(value)
    const wrapperRef = useRef<HTMLDivElement>(null)

    const handleBlur = (e: React.FocusEvent) => {
      if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
        toast.info(`Comment auto-saved on blur: ${currentValueRef.current?.length || 0} characters`)
      }
    }

    return (
      <div className="space-y-4">
        <div
          ref={wrapperRef}
          tabIndex={-1}
          onBlur={handleBlur}
          className="border-border rounded-md border p-4 focus:outline-none">
          <TiptapEditor
            value={value}
            onUpdate={val => {
              currentValueRef.current = val
              setValue(val)
            }}
            onBlur={val => {
              toast.info(`Editor blurred with: ${val.length} characters`)
            }}
            editable
            placeholder="Focus and then click outside to trigger blur save..."
            className="min-h-32"
          />
        </div>
        {value && <JsonDisplay content={value} label="Current JSON content" />}
      </div>
    )
  },
}
