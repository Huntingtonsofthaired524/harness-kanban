import { TiptapViewer } from '@/components/core/editor/tiptap-viewer'
import type { RendererComponent } from '@/property/types/property-types'

export const ReadonlyDescription: RendererComponent<string> = ({ value, meta }) => {
  const placeholder = meta.display?.placeholder ?? 'No description.'

  if (!value) {
    return <div className="text-muted-foreground">{placeholder}</div>
  }

  return <TiptapViewer content={value} />
}
