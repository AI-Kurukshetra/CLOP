import * as React from 'react'

import { cn } from '@/lib/utils/cn'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-2 block text-[13px] font-medium text-[#4A5568]', className)} {...props} />
}
