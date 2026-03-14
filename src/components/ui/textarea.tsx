import * as React from 'react'

import { cn } from '@/lib/utils/cn'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[120px] w-full rounded-md border border-[#E8ECF0] bg-white px-3 py-3 text-sm text-[#4A5568] outline-none placeholder:text-[#718096] focus:border-[#4F7EF7] focus:ring-2 focus:ring-[#4F7EF7]/15',
          className,
        )}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'
