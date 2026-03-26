import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/shadcn/utils'
import type { RendererComponent } from '@/property/types/property-types'

export const EditableTitle: RendererComponent<string> = ({ value, onChange, disabled, meta }) => {
  const [editing, setEditing] = useState(false)
  const [internal, setInternal] = useState(value ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setInternal(value ?? '')
  }, [value, editing])

  useEffect(() => {
    if (editing && !disabled) inputRef.current?.focus()
  }, [editing, disabled])

  const commit = () => {
    const trimmed = internal.trim()
    if (trimmed !== (value ?? '').trim()) {
      onChange?.(trimmed)
    }
    setEditing(false)
  }

  const cancel = () => {
    setInternal(value ?? '')
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  const placeholder = meta.display?.placeholder ?? 'Issue'

  if (!editing) {
    return (
      <div
        onClick={() => !disabled && setEditing(true)}
        className={cn(
          'text-foreground cursor-text text-balance break-words py-2 text-3xl font-bold',
          !value && 'text-muted-foreground',
        )}>
        {value || placeholder}
      </div>
    )
  }

  return (
    <input
      ref={inputRef}
      value={internal}
      onChange={e => setInternal(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'text-foreground w-full text-balance bg-transparent py-2 text-3xl font-bold',
        'placeholder:text-muted-foreground focus:outline-none focus:ring-0',
      )}
    />
  )
}
