'use client'

import { forwardRef, createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface SheetContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = createContext<SheetContextValue | undefined>(undefined)

interface SheetProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Sheet({ children, open = false, onOpenChange }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </SheetContext.Provider>
  )
}

interface SheetTriggerProps {
  children: ReactNode
  asChild?: boolean
  className?: string
  onClick?: () => void
}

export const SheetTrigger = forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ children, asChild, className, onClick, ...props }, ref) => {
    const context = useContext(SheetContext)
    
    const handleClick = () => {
      context?.onOpenChange?.(true)
      onClick?.()
    }

    if (asChild) {
      return <div onClick={handleClick}>{children}</div>
    }

    return (
      <button ref={ref} className={className} onClick={handleClick} {...props}>
        {children}
      </button>
    )
  }
)

SheetTrigger.displayName = 'SheetTrigger'

interface SheetContentProps {
  children: ReactNode
  side?: 'left' | 'right'
  className?: string
}

export function SheetContent({ children, side = 'right', className = '' }: SheetContentProps) {
  const context = useContext(SheetContext)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !context?.open) return null

  const sideStyles = {
    left: 'left-0 animate-slide-in-left',
    right: 'right-0 animate-slide-in-right'
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => context.onOpenChange(false)}
      />
      <div className={`
        fixed top-0 ${sideStyles[side]} h-full bg-white shadow-xl z-50 
        ${className}
      `}>
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => context.onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        {children}
      </div>
    </>
  )
}