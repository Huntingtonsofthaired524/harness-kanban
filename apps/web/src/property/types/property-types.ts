import React from 'react'

import { FilterOperator } from '@repo/shared/property/constants'

export type PropertyValueType = string | number | boolean | null | undefined | Record<string, unknown> | string[]

export type PropertyOptionItem = {
  value: string | number
  label: string
  icon?: React.ReactNode
}

export type PropertyOptionsLoader = () => PropertyOptionItem[] | Promise<PropertyOptionItem[]>

export type PropertyCoreMeta = {
  propertyId: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'status' | 'rich_text' | 'string[]' | 'project'
  required?: boolean
  defaultValue?: unknown
}

export type PropertyValidationMeta = {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
}

export type PropertyDisplayMeta = {
  label: string
  description?: string
  placeholder?: string
  placeholderIcon?: React.ReactNode
  defaultVisible?: boolean
  order?: number
}

export enum PropertyTableColumnLayout {
  LEFT = 'left',
  RIGHT = 'right',
  FILL = 'fill',
  HIDDEN = 'hidden',
}

export type PropertyTableMeta = {
  layout?: PropertyTableColumnLayout
  order?: number
  sortable?: boolean
  defaultVisible?: boolean
}

export type PropertyGroupMeta = {
  id: string
  label: string
  order?: number
}

export type PropertyQueryMeta = {
  sortable?: boolean
  filter?: PropertyFilterMeta // filter meta for filtering in tables
}

export enum PropertyFilterInputType {
  Text = 'text',
  Select = 'select',
  MultiSelect = 'multi-select',
  DateRange = 'date-range',
  None = 'none',
}

export interface PropertyFilterMeta {
  operators: FilterOperator[]
  input: PropertyFilterInputType
}

export type PropertyMeta = {
  core: PropertyCoreMeta
  config?: Record<string, unknown>
  validation?: PropertyValidationMeta // validation rules for the property, for zod schema generation
  query?: PropertyQueryMeta // query meta for querying in list/table page
  display?: PropertyDisplayMeta // display meta in creation/detail page
  group?: PropertyGroupMeta // group meta in creation/detail page sidepanel
  table?: PropertyTableMeta // table meta for rendering in tables, also passthrough to tanstack column meta
}

// ----- Renderer Components -----
export interface FieldRendererProps<T = PropertyValueType> {
  value: T
  onChange?: (value: T) => void
  disabled?: boolean
  meta: PropertyMeta

  // optional props for getting row data in detail/tables
  row?: PropertyRowType

  // Optional props for more complex interactions
  getValue?: GetPropertyValueFunction
  setValues?: SetPropertyValuesFunction
}

export type RendererComponent<T = PropertyValueType> = React.FC<FieldRendererProps<T>>

export type PropertyColumnMeta = PropertyMeta

export type PropertyColumnDef<TData> = import('@tanstack/react-table').AccessorKeyColumnDef<
  TData,
  PropertyValueType
> & {
  meta: PropertyMeta
}

export type PropertyRowType = Record<string, PropertyValueType> // TODO: update to use generic type
export type TableHeaderRendererComponent = React.FC

export type TableCellRendererComponent = React.FC<{
  value: PropertyValueType
  row: PropertyRowType
  meta: PropertyMeta
}>

// ----- Function Types -----

export type GetPropertyValueFunction = (propertyId: string) => PropertyValueType | undefined
export type SetPropertyValuesFunction = (updates: Record<string, PropertyValueType | undefined>) => void

// ----- Registry -----

export type PropertyShouldRenderCondition = (getValue: GetPropertyValueFunction) => boolean

export interface PropertyRendererEntry {
  type: string
  meta: PropertyMeta
  editable?: RendererComponent
  readonly: RendererComponent
  optionsLoader?: PropertyOptionsLoader
  tableHeader?: TableHeaderRendererComponent
  tableCell?: TableCellRendererComponent
  shouldRender?: PropertyShouldRenderCondition
}
