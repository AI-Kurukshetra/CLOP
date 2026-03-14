'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications } from '@/hooks/useNotifications'
import { notificationIcons } from '@/lib/constants'
import { timeAgo } from '@/lib/utils/formatDate'

export function NotificationBell({
  userId,
  role = 'borrower',
}: {
  userId?: string
  role?: 'borrower' | 'officer' | 'admin'
}) {
  const router = useRouter()
  const { notifications, unreadCount } = useNotifications(userId)
  const basePath = role === 'borrower' ? '/borrower' : '/officer'

  const recentNotifications = notifications.slice(0, 5)

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-full border border-slate-200 bg-white p-2 shadow-sm">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px]">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          <button className="text-xs font-medium text-blue-600" onClick={markAllRead}>
            Mark all read
          </button>
        </div>
        <div className="space-y-1">
          {recentNotifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
          ) : (
            recentNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type]

              return (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => {
                    if (notification.application_id) {
                      router.push(`${basePath}/applications/${notification.application_id}`)
                    } else {
                      router.push(basePath === '/borrower' ? '/borrower/notifications' : '/officer/dashboard')
                    }
                  }}
                >
                  <Icon className="h-4 w-4 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{notification.title}</p>
                    <p className="truncate text-xs text-slate-500">{notification.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">{timeAgo(notification.created_at)}</span>
                </DropdownMenuItem>
              )
            })
          )}
        </div>
        <div className="border-t border-slate-200 px-3 py-2">
          <Link href={basePath === '/borrower' ? '/borrower/notifications' : '/officer/dashboard'} className="text-xs font-medium text-blue-600">
            View all
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
