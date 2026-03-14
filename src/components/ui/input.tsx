import * as React from 'react'

import { cn } from '@/lib/utils/cn'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-[#E8ECF0] bg-white px-3 py-2 text-sm text-[#4A5568] outline-none placeholder:text-[#718096] focus:border-[#4F7EF7] focus:ring-2 focus:ring-[#4F7EF7]/15',
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'
