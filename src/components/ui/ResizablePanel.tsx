import { useState, useCallback, useRef, useEffect } from 'react'

interface ResizablePanelProps {
  children: React.ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  position: 'left' | 'right'
  onResize?: (width: number) => void
  storageKey?: string
}

export function ResizablePanel({
  children,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 800,
  position,
  onResize,
  storageKey
}: ResizablePanelProps) {
  const [width, setWidth] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey)
      return stored ? parseInt(stored, 10) : defaultWidth
    }
    return defaultWidth
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartWidth, setDragStartWidth] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartWidth(width)
    
    // Disable text selection during drag
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }, [width])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStartX
    let newWidth

    if (position === 'left') {
      newWidth = dragStartWidth + deltaX
    } else {
      newWidth = dragStartWidth - deltaX
    }

    // Enforce min/max constraints
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    
    setWidth(newWidth)
    onResize?.(newWidth)
  }, [isDragging, dragStartX, dragStartWidth, position, minWidth, maxWidth, onResize])

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return
    
    setIsDragging(false)
    
    // Re-enable text selection
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    
    // Save to localStorage if storageKey is provided
    if (storageKey) {
      localStorage.setItem(storageKey, width.toString())
    }
  }, [isDragging, width, storageKey])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const resizerPosition = position === 'left' ? 'right-0' : 'left-0'

  return (
    <div 
      ref={panelRef}
      className="relative bg-card border-border"
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Resizer Handle */}
      <div
        className={`absolute top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-naklikam-pink-500/50 transition-colors group ${resizerPosition}`}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-1 h-12 bg-border group-hover:bg-naklikam-pink-500 transition-colors rounded ${
            position === 'left' ? '-translate-x-0.5' : 'translate-x-0.5'
          } ${isDragging ? 'bg-naklikam-pink-500' : ''}`}
        />
      </div>
      
      {/* Overlay during drag */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  )
}

// For compatibility with existing code that expects these exports
export const ResizablePanelGroup = ResizablePanel
export const ResizableHandle = () => null