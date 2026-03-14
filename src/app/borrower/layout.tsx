'use client'

import { BorrowerSidebar } from '@/components/layout/BorrowerSidebar'
import { TopBar } from '@/components/layout/TopBar'
import { useNotifications } from '@/hooks/useNotifications'
import { useUser } from '@/hooks/useUser'

export default function BorrowerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUser()
  const { unreadCount } = useNotifications(user?.id)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <BorrowerSidebar user={user} unreadCount={unreadCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        <main className="page-container flex-1">{children}</main>
      </div>
    </div>
  )
}
