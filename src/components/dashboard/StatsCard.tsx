import { LucideIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  )
}
