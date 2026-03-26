import React from 'react'

import { generateColorsFromString, GeometricAvatar } from './geometric-avatar'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof GeometricAvatar> = {
  title: 'UI/GeometricAvatar',
  component: GeometricAvatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['marble', 'beam', 'pixel', 'sunset', 'ring', 'bauhaus'],
      description: 'The geometric pattern variant',
    },
    size: {
      control: { type: 'range', min: 20, max: 120, step: 10 },
      description: 'Avatar size in pixels',
    },
    name: {
      control: 'text',
      description: 'Name used to generate the pattern (consistent for same name)',
    },
    colors: {
      control: 'object',
      description: 'Custom color palette',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: 'John Doe',
    size: 80,
    variant: 'beam',
  },
}

export const Small: Story = {
  args: {
    name: 'Jane Smith',
    size: 32,
    variant: 'beam',
  },
}

export const Large: Story = {
  args: {
    name: 'Bob Wilson',
    size: 120,
    variant: 'beam',
  },
}

export const Marble: Story = {
  args: {
    name: 'Alice Brown',
    size: 80,
    variant: 'marble',
  },
}

export const Pixel: Story = {
  args: {
    name: 'Charlie Davis',
    size: 80,
    variant: 'pixel',
  },
}

export const Sunset: Story = {
  args: {
    name: 'Diana Evans',
    size: 80,
    variant: 'sunset',
  },
}

export const Ring: Story = {
  args: {
    name: 'Ethan Foster',
    size: 80,
    variant: 'ring',
  },
}

export const Bauhaus: Story = {
  args: {
    name: 'Fiona Green',
    size: 80,
    variant: 'bauhaus',
  },
}

export const CustomColors: Story = {
  args: {
    name: 'Custom User',
    size: 80,
    variant: 'beam',
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'],
  },
}

export const ConsistencyDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">Same name always generates the same pattern:</p>
      <div className="flex gap-2">
        <GeometricAvatar name="same-user" size={60} variant="beam" />
        <GeometricAvatar name="same-user" size={60} variant="beam" />
        <GeometricAvatar name="same-user" size={60} variant="beam" />
      </div>
      <p className="text-muted-foreground mt-4 text-sm">Different names generate different patterns:</p>
      <div className="flex gap-2">
        <GeometricAvatar name="user-a" size={60} variant="beam" />
        <GeometricAvatar name="user-b" size={60} variant="beam" />
        <GeometricAvatar name="user-c" size={60} variant="beam" />
      </div>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(['marble', 'beam', 'pixel', 'sunset', 'ring', 'bauhaus'] as const).map(variant => (
        <div key={variant} className="flex flex-col gap-2">
          <p className="text-sm font-medium capitalize">{variant}</p>
          <div className="flex gap-2">
            {['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan'].map(name => (
              <GeometricAvatar key={`${variant}-${name}`} name={name} size={60} variant={variant} />
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
}

export const GeneratedColors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">Colors generated from string (consistent per string):</p>
      <div className="flex gap-4">
        {['admin', 'user-1', 'developer', 'manager', 'guest'].map(str => (
          <div key={str} className="flex flex-col items-center gap-2">
            <GeometricAvatar name={str} size={60} variant="beam" colors={generateColorsFromString(str)} />
            <span className="text-muted-foreground text-xs">{str}</span>
          </div>
        ))}
      </div>
    </div>
  ),
}
