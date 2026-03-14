import { FileText } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { timeAgo } from '@/lib/utils/formatDate'
import type { Notification } from '@/types'

export function RecentActivity({ items }: { items: Notification[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No recent activity available.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="rounded-full bg-white p-2 shadow-sm">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.message}</p>
                <p className="mt-1 text-xs text-slate-500">{timeAgo(item.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
