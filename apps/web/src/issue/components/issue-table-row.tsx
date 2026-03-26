'use client'

import Link from 'next/link'
import React from 'react'

import { IssueRowType } from '@/issue/types/issue-types'
import { getTableCellRenderer } from '@/property/registry/property-registry'
import { getTableLayoutGroups } from '@/property/tables/utils/get-table-layout-groups'
import { PropertyMeta, TableCellRendererComponent } from '@/property/types/property-types'

interface IssueTableRowProps {
  row: IssueRowType
  metas: PropertyMeta[]
  href?: string
}

const FallbackRenderer: TableCellRendererComponent = () => null

export const IssueTableRow: React.FC<IssueTableRowProps> = ({ row, metas, href }) => {
  const layoutGroups = getTableLayoutGroups(metas)

  const renderField = (meta: PropertyMeta) => {
    const Renderer = getTableCellRenderer(meta.core.propertyId) || FallbackRenderer
    const value = row[meta.core.propertyId]

    return <Renderer key={meta.core.propertyId} value={value} meta={meta} row={row} />
  }

  return (
    <Link
      href={href ?? `/issues/${row.id}`}
      className="hover:bg-muted flex w-full items-center border-b px-4 py-2 transition-colors">
      <div className="mr-2 flex shrink-0 items-center gap-2">{layoutGroups.left.map(renderField)}</div>

      <div className="flex flex-1 items-center">
        <div className="flex items-center gap-2">{layoutGroups.fill.map(renderField)}</div>
      </div>

      <div className="hidden shrink-0 items-center gap-2 md:flex md:flex-wrap md:items-center md:justify-end">
        {layoutGroups.right.map(renderField)}
      </div>
    </Link>
  )
}
