import { createClient } from '@/lib/supabase/server'
import { errorResponse, successResponse } from '@/lib/utils/api'

type ActionPayload = {
  action: 'approve' | 'reject' | 'request_info'
  approved_amount?: number
  approved_rate?: number
  approved_tenure_months?: number
  officer_notes?: string
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile || (profile.role !== 'officer' && profile.role !== 'admin')) {
    return errorResponse('Forbidden', 'FORBIDDEN', 403)
  }

  const payload = (await request.json()) as ActionPayload
  const { data: application } = await supabase.from('loan_applications').select('*').eq('id', params.id).single()

  if (!application) {
    return errorResponse('Application not found', 'NOT_FOUND', 404)
  }

  const status =
    payload.action === 'approve'
      ? 'approved'
      : payload.action === 'reject'
        ? 'rejected'
        : 'additional_info_required'

  const updatePayload = {
    status,
    officer_id: user.id,
    officer_notes: payload.officer_notes,
    approved_amount: payload.approved_amount,
    approved_rate: payload.approved_rate,
    approved_tenure_months: payload.approved_tenure_months,
    reviewed_at: new Date().toISOString(),
    decision_at: payload.action === 'request_info' ? null : new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('loan_applications')
    .update(updatePayload)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    return errorResponse(error.message, 'ACTION_FAILED', 500)
  }

  await supabase.from('audit_logs').insert({
    application_id: params.id,
    performed_by: user.id,
    action: payload.action,
    old_value: { status: application.status },
    new_value: updatePayload,
  })

  const notificationMessage =
    payload.action === 'approve'
      ? `Congratulations! Your loan of ₹${Number(payload.approved_amount ?? application.amount).toLocaleString('en-IN')} has been approved.`
      : payload.action === 'reject'
        ? 'Update on your loan application — please check details.'
        : 'Your loan officer needs additional information.'

  await supabase.from('notifications').insert({
    user_id: application.borrower_id,
    application_id: params.id,
    title:
      payload.action === 'approve'
        ? 'Loan approved'
        : payload.action === 'reject'
          ? 'Application update'
          : 'Additional information required',
    message: notificationMessage,
    type: payload.action === 'request_info' ? 'document_request' : 'decision',
  })

  return successResponse(data, 'Officer action completed successfully')
}
