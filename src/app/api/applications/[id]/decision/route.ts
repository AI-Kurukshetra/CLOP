import { calculateCreditDecision } from '@/lib/creditDecision'
import { createClient } from '@/lib/supabase/server'
import { errorResponse, successResponse } from '@/lib/utils/api'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  const { data: application, error: applicationError } = await supabase
    .from('loan_applications')
    .select('*, loan_product:loan_products(*)')
    .eq('id', params.id)
    .single()

  if (applicationError || !application?.loan_product) {
    return errorResponse(applicationError?.message ?? 'Application not found', 'APPLICATION_NOT_FOUND', 404)
  }

  try {
    const result = calculateCreditDecision({
      amount: Number(application.amount),
      annual_income: Number(application.annual_income),
      tenure_months: Number(application.tenure_months),
      self_reported_credit_score: application.self_reported_credit_score,
      employment_status: application.employment_status,
      interest_rate: Number(application.loan_product.base_interest_rate),
      base_rate: Number(application.loan_product.base_interest_rate),
    })

    const { error: updateError } = await supabase
      .from('loan_applications')
      .update({
        ai_decision: result.decision,
        ai_confidence: result.confidence,
        ai_reasoning: result.reasoning,
        ai_suggested_rate: result.suggested_rate,
        ai_risk_level: result.risk_level,
        ai_key_factors: result.key_factors,
        ai_red_flags: result.red_flags,
        status: 'under_review',
      })
      .eq('id', params.id)

    if (updateError) {
      return errorResponse(updateError.message, 'UPDATE_FAILED', 500)
    }

    await supabase.from('audit_logs').insert({
      application_id: application.id,
      performed_by: application.borrower_id,
      action: 'rules_engine_completed',
      new_value: {
        ai_decision: result.decision,
        confidence: result.confidence,
        risk_level: result.risk_level,
      },
    })

    await supabase.from('notifications').insert({
      user_id: application.borrower_id,
      application_id: application.id,
      title: 'AI has analyzed your application',
      message: 'Your application has been analyzed. Check your result.',
      type: 'decision',
    })

    return successResponse(result, 'AI decision generated successfully')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI decision failed'
    return errorResponse(message, 'AI_DECISION_FAILED', 500)
  }
}
