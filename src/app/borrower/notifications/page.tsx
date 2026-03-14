'use client'

import { useMemo } from 'react'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { useNotifications } from '@/hooks/useNotifications'
import { useUser } from '@/hooks/useUser'
import { formatDateTime } from '@/lib/utils/formatDate'

export default function BorrowerNotificationsPage() {
  const router = useRouter()
  const { user } = useUser()
  const { notifications } = useNotifications(user?.id)

  const grouped = useMemo(() => {
    const now = new Date()

    return notifications.reduce<Record<string, typeof notifications>>((acc, notification) => {
      const created = new Date(notification.created_at)
      const diff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      const key = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : 'Earlier'
      acc[key] = [...(acc[key] ?? []), notification]
      return acc
    }, {})
  }, [notifications])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    router.refresh()
  }

  if (!notifications.length) {
    return <EmptyState icon={Bell} title="No notifications yet" description="Application and decision updates will appear here." />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>All Notifications</CardTitle>
        <Button variant="outline" onClick={markAllRead}>
          Mark all as read
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{group}</p>
            <div className="space-y-3">
              {items.map((notification) => (
                <button
                  key={notification.id}
                  className={`w-full rounded-2xl border p-4 text-left ${notification.read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50'}`}
                  onClick={async () => {
                    await fetch('/api/notifications', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: notification.id }),
                    })
                    router.push(notification.application_id ? `/borrower/applications/${notification.application_id}` : '/borrower/notifications')
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                    </div>
                    <span className="text-xs text-slate-500">{formatDateTime(notification.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
