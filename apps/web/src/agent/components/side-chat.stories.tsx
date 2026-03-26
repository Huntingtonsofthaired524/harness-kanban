import * as React from 'react'

import { SideChat } from './side-chat'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof SideChat> = {
  title: 'Agent/SideChat',
  component: SideChat,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof SideChat>

// ============================================
// Simple Stories (original)
// ============================================

// Main content to simulate page content (like layout.tsx children)
const MainContent = () => (
  <div className="p-8">
    <h1 className="mb-4 text-2xl font-bold">Main Dashboard</h1>
    <p className="text-muted-foreground mb-4">This is the main page content area.</p>
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-lg bg-gray-100 p-4">Card 1</div>
      <div className="rounded-lg bg-gray-100 p-4">Card 2</div>
      <div className="rounded-lg bg-gray-100 p-4">Card 3</div>
    </div>
  </div>
)

// Layout structure exactly like layout.tsx
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen flex-1 overflow-hidden">
    <div className="flex-1 overflow-auto">
      <MainContent />
    </div>
    {children}
  </div>
)

export const Collapsed: Story = {
  args: {},
  decorators: [
    Story => (
      <LayoutWrapper>
        <Story />
      </LayoutWrapper>
    ),
  ],
}

export const Expanded: Story = {
  args: {},
  decorators: [
    Story => (
      <LayoutWrapper>
        <Story />
      </LayoutWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    // Find and click the toggle button to open the chat
    const toggleButton = canvasElement.querySelector('[aria-label="Open chat"]') as HTMLButtonElement
    if (toggleButton) {
      toggleButton.click()
    }
  },
}

// ============================================
// Realistic Issue List Page Simulation
// ============================================

// Simulates the Header component
const SimulatedHeader = () => (
  <div className="bg-background sticky top-0 z-40 w-full border-b">
    <div className="container mx-auto flex h-[var(--header-height)] max-w-6xl items-center justify-between px-2 md:px-6">
      <div className="font-semibold">Logo</div>
      <div className="flex items-center gap-4">
        <div className="bg-muted size-5 rounded-full" />
        <div className="bg-muted size-8 rounded-full" />
      </div>
    </div>
  </div>
)

// Simulates the navbar below header
const SimulatedNavbar = () => (
  <div className="bg-background sticky top-[var(--header-height)] z-30 w-full border-b">
    <div className="container mx-auto flex h-[var(--navbar-height)] max-w-6xl items-center px-2 md:px-6">
      <div className="flex items-center gap-2">
        <div className="bg-muted h-8 w-24 rounded" />
        <div className="bg-muted h-8 w-24 rounded" />
        <div className="bg-muted h-8 w-24 rounded" />
      </div>
    </div>
  </div>
)

// Simulates the IssueListPage content structure
// Uses Fragment <>...</> like the real component, no height constraints
const IssueListPageSimulation = () => (
  <>
    <SimulatedHeader />
    <SimulatedNavbar />
    <div className="container mx-auto w-full max-w-6xl px-2 py-4 md:px-6">
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className="mb-2 flex items-center gap-4 rounded-sm border p-4">
          <div className="text-muted-foreground w-8 font-mono text-sm">{i + 1}</div>
          <div className="flex-1">
            <div className="font-medium">Issue Title {i + 1}</div>
            <div className="text-muted-foreground text-sm">Description for issue {i + 1}</div>
          </div>
          <div className="bg-muted h-6 w-20 rounded" />
        </div>
      ))}
    </div>
  </>
)

// Full layout simulation matching the real app structure:
// - body: min-h-screen flex-col
// - flex container: h-screen flex-1 overflow-hidden
// - children: overflow-auto
// - SideChat: as sibling
const RealLayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <div className="flex h-screen flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <IssueListPageSimulation />
      </div>
      {children}
    </div>
  </div>
)

// Story to reproduce the scroll issue
export const WithIssueListPage: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Simulates the real Issue List page structure with Header, sticky navbar, and long content. This should reproduce the scroll issue where side chat scrolls with main content.',
      },
    },
  },
  decorators: [
    Story => (
      <RealLayoutWrapper>
        <Story />
      </RealLayoutWrapper>
    ),
  ],
  play: async ({ canvasElement }) => {
    const toggleButton = canvasElement.querySelector('[aria-label="Open chat"]') as HTMLButtonElement
    if (toggleButton) {
      toggleButton.click()
    }
  },
}
