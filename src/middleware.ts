import { NextResponse, type NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

async function getRoleForUser(supabase: Awaited<ReturnType<typeof updateSession>>['supabase'], userId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  return profile?.role ?? null
}

export async function middleware(request: NextRequest) {
  const { response, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const role = user ? await getRoleForUser(supabase, user.id) : null

  if (pathname === '/' || pathname.startsWith('/api/auth/callback')) {
    return response
  }

  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    if (user) {
      if (role === 'officer' || role === 'admin') {
        return NextResponse.redirect(new URL('/officer/dashboard', request.url))
      }

      if (role === 'borrower') {
        return NextResponse.redirect(new URL('/borrower/dashboard', request.url))
      }
    }

    return response
  }

  if (pathname.startsWith('/borrower')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (!role) {
      return NextResponse.redirect(new URL('/login?missing_profile=1', request.url))
    }

    if (role !== 'borrower') {
      return NextResponse.redirect(new URL('/officer/dashboard', request.url))
    }
  }

  if (pathname.startsWith('/officer')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (!role) {
      return NextResponse.redirect(new URL('/login?missing_profile=1', request.url))
    }

    if (role !== 'officer' && role !== 'admin') {
      return NextResponse.redirect(new URL('/borrower/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
