import { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { errorResponse, successResponse } from '@/lib/utils/api'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  let query = supabase.from('loan_products').select('*').order('base_interest_rate', { ascending: true })
  if (request.nextUrl.searchParams.get('all') !== '1') {
    query = query.eq('is_active', true)
  }
  const { data, error } = await query

  if (error) {
    return errorResponse(error.message, 'FETCH_FAILED', 500)
  }

  return successResponse(data, 'Loan products fetched successfully')
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || (profile.role !== 'officer' && profile.role !== 'admin')) {
    return errorResponse('Forbidden', 'FORBIDDEN', 403)
  }

  const body = (await request.json()) as Record<string, unknown>
  const admin = createAdminClient()
  const { data, error } = await admin.from('loan_products').update(body).eq('id', body.id).select('*').single()

  if (error) {
    return errorResponse(error.message, 'UPDATE_FAILED', 500)
  }

  return successResponse(data, 'Loan product updated successfully')
}
