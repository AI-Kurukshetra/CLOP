'use client'

import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils/cn'

export function Progress({
  className,
  value,
}: {
  className?: string
  value: number
}) {
  return (
    <ProgressPrimitive.Root className={cn('relative h-2 w-full overflow-hidden rounded-full bg-[#F0F2F5]', className)} value={value}>
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-[#4F7EF7] transition-all"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
