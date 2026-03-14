'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const pageTitleMap: Record<string, string> = {
  '/borrower/dashboard': 'Borrower Dashboard',
  '/borrower/apply': 'Apply for a Loan',
  '/borrower/applications': 'My Applications',
  '/borrower/documents': 'Documents',
  '/borrower/notifications': 'Notifications',
  '/officer/dashboard': 'Officer Dashboard',
  '/officer/pipeline': 'Application Pipeline',
  '/officer/analytics': 'Portfolio Analytics',
  '/officer/loan-products': 'Loan Products',
}

export function TopBar({ user }: { user: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()

  const pageTitle = useMemo(() => {
    if (pathname.includes('/applications/')) {
      return pathname.startsWith('/officer/') ? 'Application Review' : 'Application Tracking'
    }

    return pageTitleMap[pathname] ?? 'LendFlow'
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#E8ECF0] bg-[#F5F7FA]">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <h1>{pageTitle}</h1>
          <p className="text-sm text-[#718096]">Monitor the loan journey end to end.</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell userId={user?.id} role={user?.role ?? 'borrower'} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-full border border-[#E8ECF0] bg-white px-2 py-1.5 shadow-sm">
                <Avatar name={user?.full_name} />
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-[#1A202C]">{user?.full_name ?? 'Account'}</p>
                  <p className="text-xs text-[#718096]">{user?.email ?? '...'}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={pathname.startsWith('/officer') ? '/officer/dashboard' : '/borrower/dashboard'}>Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
