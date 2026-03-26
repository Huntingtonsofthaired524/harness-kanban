import { PropertyColumnDef, PropertyMeta, PropertyRowType, PropertyValueType } from '@/property/types/property-types'
import { getPropertyRendererEntry, getReadonlyRenderer } from '../registry/property-registry'

export const usePropertyColumns = <TData extends PropertyRowType>(
  metas: PropertyMeta[],
): PropertyColumnDef<TData>[] => {
  return metas.map(meta => {
    const Renderer = getReadonlyRenderer(meta.core.propertyId)
    const entry = getPropertyRendererEntry(meta.core.propertyId)

    return {
      accessorKey: meta.core.propertyId,
      header: () => {
        if (entry?.tableHeader) {
          const TableHeaderComponent = entry.tableHeader
          return <TableHeaderComponent />
        }
        return <span>{meta.display?.label ?? meta.core.propertyId}</span>
      },
      cell: info => {
        const value = info.getValue() as PropertyValueType
        const row = info.row.original

        if (entry?.tableCell) {
          const TableCellComponent = entry.tableCell
          return <TableCellComponent value={value} row={row} meta={meta} />
        }

        return Renderer ? <Renderer value={value} meta={meta} /> : <span>{String(value ?? '')}</span>
      },
      meta: meta,
      enableHiding: true,
    }
  })
}
