import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg border text-sm font-normal transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7EF7]/20',
  {
    variants: {
      variant: {
        default: 'border-[#4F7EF7] bg-[#4F7EF7] text-white hover:border-[#3D6CE4] hover:bg-[#3D6CE4]',
        secondary: 'border-[#E8ECF0] bg-white text-[#4A5568] hover:bg-[#F8FAFC]',
        outline: 'border-[#E8ECF0] bg-white text-[#4A5568] hover:bg-[#F8FAFC]',
        success: 'border-[#D5EEDD] bg-[#E8F5EE] text-[#1A7F4B] hover:bg-[#dff2e8]',
        danger: 'border-[#FBCACA] bg-[#FDEEEE] text-[#C0392B] hover:bg-[#fae4e4]',
        ghost: 'border-transparent bg-transparent text-[#4A5568] hover:bg-[#F8FAFC]',
      },
      size: {
        default: 'h-10 px-5 py-2.5',
        sm: 'h-9 px-3',
        lg: 'h-10 px-5 py-2.5',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className)

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(classes, (children.props as { className?: string }).className),
      })
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
