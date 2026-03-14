import { createClient } from '@/lib/supabase/server'
import { errorResponse, successResponse } from '@/lib/utils/api'
import type { ApplicationStatus } from '@/types'

const writableFields = new Set([
  'status',
  'officer_notes',
  'approved_amount',
  'approved_rate',
  'approved_tenure_months',
  'reviewed_at',
  'decision_at',
])

const validStatuses: ApplicationStatus[] = [
  'pending',
  'under_review',
  'additional_info_required',
  'approved',
  'rejected',
  'disbursed',
  'cancelled',
]

async function getUserContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, profile: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  return { supabase, user, profile }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { supabase, user, profile } = await getUserContext()

  if (!user || !profile) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  const selectClause =
    profile.role === 'officer' || profile.role === 'admin'
      ? '*, borrower:profiles!loan_applications_borrower_id_fkey(*), loan_product:loan_products(*), documents(*), audit_logs(*)'
      : '*, loan_product:loan_products(*), documents(*)'

  let query = supabase.from('loan_applications').select(selectClause).eq('id', params.id)
  if (profile.role === 'borrower') {
    query = query.eq('borrower_id', user.id)
  }

  const { data, error } = await query.single()

  if (error) {
    return errorResponse(error.message, 'NOT_FOUND', 404)
  }

  return successResponse(data, 'Application fetched successfully')
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user, profile } = await getUserContext()

  if (!user || !profile) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  if (profile.role !== 'officer' && profile.role !== 'admin') {
    return errorResponse('Forbidden', 'FORBIDDEN', 403)
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return errorResponse('Invalid JSON payload', 'INVALID_PAYLOAD', 400)
  }

  const updates = Object.fromEntries(
    Object.entries(body).filter(
      ([key, value]) => writableFields.has(key) && value !== undefined,
    ),
  )

  if (!Object.keys(updates).length) {
    return errorResponse(
      'No supported fields supplied for update',
      'VALIDATION_FAILED',
      400,
    )
  }

  if (
    'status' in updates &&
    (typeof updates.status !== 'string' ||
      !validStatuses.includes(updates.status as ApplicationStatus))
  ) {
    return errorResponse('Invalid application status', 'VALIDATION_FAILED', 400)
  }

  if (
    'approved_amount' in updates &&
    (!Number.isFinite(Number(updates.approved_amount)) ||
      Number(updates.approved_amount) <= 0)
  ) {
    return errorResponse('Approved amount must be greater than 0', 'VALIDATION_FAILED', 400)
  }

  if (
    'approved_rate' in updates &&
    (!Number.isFinite(Number(updates.approved_rate)) || Number(updates.approved_rate) <= 0)
  ) {
    return errorResponse('Approved rate must be greater than 0', 'VALIDATION_FAILED', 400)
  }

  if (
    'approved_tenure_months' in updates &&
    (!Number.isInteger(Number(updates.approved_tenure_months)) ||
      Number(updates.approved_tenure_months) <= 0)
  ) {
    return errorResponse(
      'Approved tenure must be a positive integer',
      'VALIDATION_FAILED',
      400,
    )
  }

  const { data, error } = await supabase
    .from('loan_applications')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    return errorResponse(error.message, 'UPDATE_FAILED', 500)
  }

  return successResponse(data, 'Application updated successfully')
}
