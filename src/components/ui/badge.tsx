import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-[#F8FAFC] text-[#718096]',
        success: 'bg-[#E8F5EE] text-[#1A7F4B]',
        warning: 'bg-[#FEF6E4] text-[#92610A]',
        review: 'bg-[#EAF2FF] text-[#1D5FA6]',
        danger: 'bg-[#FDEEEE] text-[#C0392B]',
        info: 'bg-[#F0EBFF] text-[#5B30A6]',
        orange: 'bg-[#FFF3E8] text-[#AD5A00]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
