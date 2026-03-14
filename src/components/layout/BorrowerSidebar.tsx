'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME, borrowerNavItems } from '@/lib/constants'
import type { Profile } from '@/types'

export function BorrowerSidebar({
  user,
  unreadCount,
}: {
  user: Profile | null
  unreadCount: number
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[#E8ECF0] bg-white lg:flex">
      <div className="border-b border-[#E8ECF0] p-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-md bg-[#4F7EF7] px-3 py-2 text-sm font-semibold text-white">{APP_NAME}</div>
          <div>
            <p className="text-sm font-semibold text-[#1A202C]">Borrower Portal</p>
            <p className="text-xs text-[#718096]">Track and manage applications</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {borrowerNavItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-10 items-center justify-between rounded-md border-l-[3px] border-transparent px-3 text-sm font-medium text-[#4A5568] transition hover:bg-[#F8FAFC]',
                active && 'border-l-[#4F7EF7] bg-[#EEF3FF] text-[#4F7EF7]',
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.href.endsWith('/notifications') && unreadCount > 0 ? <Badge variant="danger">{unreadCount}</Badge> : null}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-[#E8ECF0] p-4">
        <div className="mb-4 flex items-center gap-3 rounded-md bg-[#F8FAFC] p-3">
          <Avatar name={user?.full_name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#1A202C]">{user?.full_name ?? 'Borrower'}</p>
            <p className="truncate text-xs text-[#718096]">{user?.email ?? 'Loading...'}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </aside>
  )
}
