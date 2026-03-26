import { Binoculars, HeartPulse, ListCheck, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import React, { useState } from 'react'

import { EditableSelector } from '@/property/components/fields/selector/editable-selector'
import { registerPropertyRenderer } from '@/property/registry/property-registry'
import { Meta, StoryObj } from '@storybook/react'
import type { PropertyMeta } from '@/property/types/property-types'

// Mock property meta for stories
const createMockMeta = (overrides: Partial<PropertyMeta> = {}): PropertyMeta => ({
  core: {
    propertyId: 'test-selector',
    type: 'string',
    required: false,
    ...overrides.core,
  },
  display: {
    label: 'Status',
    placeholder: 'Select status',
    ...overrides.display,
  },
  ...overrides,
})

// Register a test property with options
registerPropertyRenderer('test-selector', {
  type: 'selector',
  meta: createMockMeta(),
  editable: EditableSelector,
  readonly: EditableSelector,
  optionsLoader: () => [
    { value: 'investigating', label: 'Investigating', icon: <Binoculars className="h-4 w-4" /> },
    { value: 'fixing', label: 'Fixing', icon: <Wrench className="h-4 w-4" /> },
    { value: 'monitoring', label: 'Monitoring', icon: <HeartPulse className="h-4 w-4" /> },
    { value: 'resolved', label: 'Resolved', icon: <ListCheck className="h-4 w-4" /> },
  ],
})

// Register a numeric test property
registerPropertyRenderer('test-numeric-selector', {
  type: 'selector',
  meta: createMockMeta({
    core: { propertyId: 'test-numeric-selector', type: 'number', required: false },
    display: { label: 'Priority', placeholder: 'Select priority' },
  }),
  editable: EditableSelector,
  readonly: EditableSelector,
  optionsLoader: () => [
    { value: 1, label: 'Low', icon: <Wrench className="h-4 w-4" /> },
    { value: 2, label: 'Medium', icon: <HeartPulse className="h-4 w-4" /> },
    { value: 3, label: 'High', icon: <ListCheck className="h-4 w-4" /> },
  ],
})

const meta: Meta<typeof EditableSelector> = {
  title: 'Property/EditableSelector',
  component: EditableSelector,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof EditableSelector>

export const WithValue: Story = {
  render: () => <EditableSelector meta={createMockMeta()} value="monitoring" onChange={() => {}} />,
}

export const Disabled: Story = {
  render: () => <EditableSelector meta={createMockMeta()} value="monitoring" onChange={() => {}} disabled />,
}

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>('monitoring')
    return (
      <EditableSelector
        meta={createMockMeta()}
        value={value}
        onChange={val => {
          setValue(val as string | null)
          toast.success(`Changed value to "${val ?? 'undefined'}"`)
        }}
      />
    )
  },
}

export const Placeholder: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null)
    return (
      <EditableSelector
        meta={createMockMeta()}
        value={value}
        onChange={val => {
          setValue(val as string | null)
          toast.success(`Changed value to "${val ?? 'undefined'}"`)
        }}
      />
    )
  },
}

export const Nullable: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>('fixing')
    return (
      <EditableSelector
        meta={createMockMeta({
          core: { propertyId: 'test-selector', type: 'string', required: false },
        })}
        value={value}
        onChange={val => {
          setValue(val as string | null)
          toast.success(`Changed value to "${val ?? 'undefined'}"`)
        }}
      />
    )
  },
}

export const NumericOptions: Story = {
  render: () => {
    const [value, setValue] = useState<number | null>(2)
    return (
      <EditableSelector
        meta={createMockMeta({
          core: { propertyId: 'test-numeric-selector', type: 'number', required: false },
          display: { label: 'Priority', placeholder: 'Select priority' },
        })}
        value={value}
        onChange={val => {
          setValue(val as number | null)
          toast.success(`Changed value to ${val ?? 'undefined'}`)
        }}
      />
    )
  },
}
