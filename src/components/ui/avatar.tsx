import { UserCircle2 } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

export function Avatar({
  name,
  className,
}: {
  name?: string
  className?: string
}) {
  if (!name) {
    return <UserCircle2 className={cn('h-9 w-9 text-[#718096]', className)} />
  }

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={cn('flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF2FF] text-sm font-semibold text-[#1D5FA6]', className)}>
      {initials}
    </div>
  )
}
