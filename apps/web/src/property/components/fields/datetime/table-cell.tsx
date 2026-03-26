import { TableCellRendererComponent } from '@/property/types/property-types'
import { formatDisplayDate } from '@repo/shared/lib/utils/datetime'

export const DatatimeTableCell: TableCellRendererComponent = ({ value }) => {
  if (!value || typeof value !== 'number') {
    return null
  }

  return (
    <span className="text-foreground min-w-12 truncate text-right text-sm leading-tight">
      {formatDisplayDate(value)}
    </span>
  )
}
