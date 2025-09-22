// reusable button component with different variants and sizes
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

// base styling with consistent interactions
const BASE_CLASSES = 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2'

// visual appearance variants for different use cases
const BUTTON_VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500',
  secondary: 'border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-transparent focus:ring-white/50',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500 shadow-sm'
} as const

// size variants with different padding and text sizes
const BUTTON_SIZES = {
  sm: 'px-4 py-2 text-sm rounded-md',
  md: 'px-6 py-3 text-base rounded-lg', 
  lg: 'px-8 py-4 text-lg rounded-lg',
  icon: 'p-2 rounded-md'
} as const

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variantClass = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary
    const sizeClass = BUTTON_SIZES[size] || BUTTON_SIZES.md
    const classes = [BASE_CLASSES, variantClass, sizeClass, className]
      .filter(Boolean)
      .join(' ')
    
    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
