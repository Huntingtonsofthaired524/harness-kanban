'use client'

import { AnimatePresence, motion, TargetAndTransition, Transition } from 'framer-motion'
import React, { ReactNode, useCallback, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/shadcn/utils'

export interface Tab {
  label: string
  value: string
}

interface AnimatedTabsProps {
  tabs: Tab[]
  children?: ReactNode
  defaultTab?: string
  value?: string
  onTabChange?: (tabValue: string) => void
  className?: string
}

interface AnimatedTabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

const TRANSITION: Transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.15,
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  children,
  defaultTab,
  value,
  onTabChange,
  className,
}) => {
  const navRef = useRef<HTMLDivElement>(null)
  const [buttonRefs, setButtonRefs] = useState<(HTMLButtonElement | null)[]>([])
  const [hoveredTabIndex, setHoveredTabIndex] = useState<number | null>(null)

  // Controlled or uncontrolled value
  const [internalValue, setInternalValue] = useState(defaultTab || tabs[0]?.value || '')
  const activeValue = value ?? internalValue

  const selectedTabIndex = useMemo(() => tabs.findIndex(tab => tab.value === activeValue), [tabs, activeValue])

  const handleTabClick = useCallback(
    (tabValue: string) => {
      if (!value) {
        setInternalValue(tabValue)
      }
      onTabChange?.(tabValue)
    },
    [value, onTabChange],
  )

  // Calculate positions for animations
  const navRect = navRef.current?.getBoundingClientRect()
  const selectedRect = buttonRefs[selectedTabIndex]?.getBoundingClientRect()
  const hoveredRect = hoveredTabIndex !== null ? buttonRefs[hoveredTabIndex]?.getBoundingClientRect() : null

  const getAnimationProps = useCallback(
    (rect: DOMRect, navRect: DOMRect): TargetAndTransition => ({
      x: rect.left - navRect.left,
      width: rect.width,
    }),
    [],
  )

  // Update button refs array when tabs change
  React.useEffect(() => {
    setButtonRefs(prev => {
      const newRefs = [...prev]
      newRefs.length = tabs.length
      return newRefs
    })
  }, [tabs.length])

  return (
    <div className={cn('w-full', className)}>
      <div className="relative flex w-full items-center justify-between overflow-x-auto overflow-y-hidden border-b dark:border-zinc-800">
        <nav
          ref={navRef}
          className="relative z-0 flex flex-shrink-0 items-center justify-center py-2"
          onPointerLeave={() => setHoveredTabIndex(null)}>
          {tabs.map((tab, index) => {
            const isActive = selectedTabIndex === index

            return (
              <button
                key={tab.value}
                ref={el => {
                  buttonRefs[index] = el
                }}
                className={cn(
                  'relative z-20 flex h-8 cursor-pointer select-none items-center rounded-md bg-transparent px-4 text-sm transition-colors',
                  isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground',
                )}
                onPointerEnter={() => setHoveredTabIndex(index)}
                onFocus={() => setHoveredTabIndex(index)}
                onClick={() => handleTabClick(tab.value)}>
                {tab.label}
              </button>
            )
          })}

          {/* Hover effect */}
          <AnimatePresence>
            {hoveredRect && navRect && (
              <motion.div
                key="hover"
                className="bg-accent absolute left-0 top-1 z-10 h-[calc(100%-8px)] rounded-md"
                initial={{ opacity: 0, ...getAnimationProps(hoveredRect, navRect) }}
                animate={{ opacity: 1, ...getAnimationProps(hoveredRect, navRect) }}
                exit={{ opacity: 0 }}
                transition={TRANSITION}
              />
            )}
          </AnimatePresence>

          {/* Active tab indicator */}
          {selectedRect && navRect && (
            <motion.div
              className="bg-primary absolute bottom-0 left-0 z-10 h-[2px]"
              initial={false}
              animate={getAnimationProps(selectedRect, navRect)}
              transition={TRANSITION}
            />
          )}
        </nav>
      </div>
      {children}
    </div>
  )
}

export const AnimatedTabsContent: React.FC<AnimatedTabsContentProps> = ({ value, children, className }) => {
  return (
    <div data-tab-value={value} className={cn('tab-content', className)}>
      {children}
    </div>
  )
}
