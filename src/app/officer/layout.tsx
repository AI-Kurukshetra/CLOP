'use client'

import { OfficerSidebar } from '@/components/layout/OfficerSidebar'
import { TopBar } from '@/components/layout/TopBar'
import { useUser } from '@/hooks/useUser'

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUser()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <OfficerSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        <main className="page-container flex-1">{children}</main>
      </div>
    </div>
  )
}
