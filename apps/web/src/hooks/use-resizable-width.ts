import { useCallback, useEffect, useRef, useState } from 'react'

import { useLocalStorage } from './use-local-storage'

interface UseResizableWidthOptions {
  storageKey: string
  defaultWidth: number
  minWidth?: number
  maxWidth?: number
}

interface UseResizableWidthReturn {
  width: number
  isResizing: boolean
  resizeHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void
    onTouchStart: (e: React.TouchEvent) => void
  }
}

export function useResizableWidth(options: UseResizableWidthOptions): UseResizableWidthReturn {
  const { storageKey, defaultWidth, minWidth = 280, maxWidth = 800 } = options

  const [width, setWidth] = useLocalStorage(storageKey, defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(width)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)
      startXRef.current = e.clientX
      startWidthRef.current = width
    },
    [width],
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      setIsResizing(true)
      startXRef.current = touch.clientX
      startWidthRef.current = width
    },
    [width],
  )

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startXRef.current - e.clientX
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, minWidth), maxWidth)
      setWidth(newWidth)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      const delta = startXRef.current - touch.clientX
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, minWidth), maxWidth)
      setWidth(newWidth)
    }

    const handleEnd = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleEnd)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [isResizing, minWidth, maxWidth, setWidth])

  return {
    width,
    isResizing,
    resizeHandleProps: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
    },
  }
}
