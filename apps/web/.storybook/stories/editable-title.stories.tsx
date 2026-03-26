import { toast } from 'sonner'
import { useArgs } from 'storybook/preview-api'

import { EditableTitle } from '@/property/components/fields/title/editable-title'
import type { FieldRendererProps } from '@/property/types/property-types'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<FieldRendererProps<string> & { autoFocus?: boolean }> = {
  title: 'Core/EditableTitle',
  component: EditableTitle,
  args: {
    value: 'Example Issue',
  },
  argTypes: {
    value: { control: 'text' },
    autoFocus: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<FieldRendererProps<string>>

const propertyMeta = {
  core: {
    propertyId: 'property0002',
    type: 'string',
    required: true,
  },
  validation: {
    minLength: 1,
    maxLength: 100,
  },
  display: {
    label: 'Title',
    placeholder: 'Issue #',
  },
  query: {
    sortable: true,
    filter: {
      input: 'text',
      operators: ['contains'],
    },
  },
  table: {
    layout: 'fill',
  },
} as const

const withArgs = (): Story['render'] => props => {
  const [{ value }, updateArgs] = useArgs()

  return (
    <EditableTitle
      {...props}
      value={value}
      meta={propertyMeta as any}
      onChange={val => {
        updateArgs({ value: val })
        toast.success(`Saved: ${val}`)
      }}
    />
  )
}
export const Playground: Story = {
  render: withArgs(),
}
export const AutoFocus: Story = {
  args: {
    value: 'Focused Title',
  },
  parameters: {
    autoFocus: true,
  },
  render: withArgs(),
}
export const Placeholder: Story = {
  args: {
    value: '',
  },
  render: withArgs(),
}
export const Disabled: Story = {
  args: {
    value: 'Disabled Title',
    disabled: true,
  },
  render: withArgs(),
}
