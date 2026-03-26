import type { RendererComponent } from '@/property/types/property-types'

export const ReadonlyTitle: RendererComponent<string> = ({ value, meta }) => {
  const placeholder = meta.display?.placeholder ?? '—'
  return <div className="text-foreground text-balance break-words py-2 text-3xl font-bold">{value || placeholder}</div>
}
