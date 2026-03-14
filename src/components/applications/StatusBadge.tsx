import { Badge } from '@/components/ui/badge'
import { statusStyles } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'
import type { ApplicationStatus } from '@/types'

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge className={cn(statusStyles[status])}>
      {status.replaceAll('_', ' ')}
    </Badge>
  )
}
