import { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { errorResponse, successResponse } from '@/lib/utils/api'
import type { EmploymentStatus, LoanApplication } from '@/types'

const employmentStatuses: EmploymentStatus[] = [
  'salaried',
  'self_employed',
  'business_owner',
  'unemployed',
  'student',
]

function getOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

async function getUserProfile() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, profile: null }
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return { supabase, user, profile }
}

export async function GET(request: NextRequest) {
  const { supabase, user, profile } = await getUserProfile()

  if (!user || !profile) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')

  let query = supabase
    .from('loan_applications')
    .select('*, borrower:profiles!loan_applications_borrower_id_fkey(*), loan_product:loan_products(*)')
    .order('created_at', { ascending: false })

  if (profile.role === 'borrower') {
    query = query.eq('borrower_id', user.id)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return errorResponse(error.message, 'FETCH_FAILED', 500)
  }

  return successResponse(data as LoanApplication[], 'Applications fetched successfully')
}

export async function POST(request: Request) {
  const { supabase, user, profile } = await getUserProfile()

  if (!user || !profile) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  if (profile.role !== 'borrower') {
    return errorResponse('Only borrowers can create applications', 'FORBIDDEN', 403)
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return errorResponse('Invalid JSON payload', 'INVALID_PAYLOAD', 400)
  }

  const loanProductId =
    typeof body.loan_product_id === 'string' ? body.loan_product_id : ''
  const amount = Number(body.amount)
  const tenureMonths = Number(body.tenure_months)
  const purpose = getOptionalString(body.purpose)
  const annualIncome = Number(body.annual_income)
  const employmentStatus =
    typeof body.employment_status === 'string' ? body.employment_status : ''
  const employerName = getOptionalString(body.employer_name)
  const existingLoans = getOptionalString(body.existing_loans)
  const additionalNotes = getOptionalString(body.additional_notes)

  const rawCreditScore = body.self_reported_credit_score
  const creditScore =
    rawCreditScore === null || rawCreditScore === undefined || rawCreditScore === ''
      ? null
      : Number(rawCreditScore)

  if (!loanProductId) {
    return errorResponse('Loan product is required', 'VALIDATION_FAILED', 400)
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return errorResponse('Loan amount must be greater than 0', 'VALIDATION_FAILED', 400)
  }

  if (!Number.isInteger(tenureMonths) || tenureMonths <= 0) {
    return errorResponse(
      'Loan tenure must be a positive number of months',
      'VALIDATION_FAILED',
      400,
    )
  }

  if (!purpose) {
    return errorResponse('Loan purpose is required', 'VALIDATION_FAILED', 400)
  }

  if (!Number.isFinite(annualIncome) || annualIncome <= 0) {
    return errorResponse(
      'Annual income must be greater than 0',
      'VALIDATION_FAILED',
      400,
    )
  }

  if (!employmentStatuses.includes(employmentStatus as EmploymentStatus)) {
    return errorResponse('Invalid employment status', 'VALIDATION_FAILED', 400)
  }

  if (
    creditScore !== null &&
    (!Number.isInteger(creditScore) || creditScore < 300 || creditScore > 900)
  ) {
    return errorResponse(
      'Credit score must be between 300 and 900',
      'VALIDATION_FAILED',
      400,
    )
  }

  const { data: loanProduct, error: loanProductError } = await supabase
    .from('loan_products')
    .select(
      'id, min_amount, max_amount, min_tenure_months, max_tenure_months, is_active',
    )
    .eq('id', loanProductId)
    .maybeSingle()

  if (loanProductError || !loanProduct) {
    return errorResponse('Loan product not found', 'INVALID_LOAN_PRODUCT', 400)
  }

  if (!loanProduct.is_active) {
    return errorResponse(
      'Selected loan product is inactive',
      'VALIDATION_FAILED',
      400,
    )
  }

  if (amount < Number(loanProduct.min_amount) || amount > Number(loanProduct.max_amount)) {
    return errorResponse('Loan amount is outside product limits', 'VALIDATION_FAILED', 400)
  }

  if (
    tenureMonths < Number(loanProduct.min_tenure_months) ||
    tenureMonths > Number(loanProduct.max_tenure_months)
  ) {
    return errorResponse('Loan tenure is outside product limits', 'VALIDATION_FAILED', 400)
  }

  const documentsInput = Array.isArray(body.documents) ? body.documents : []
  const documents: Array<{
    doc_type: string
    file_name: string
    file_url: string
    file_size?: number
  }> = []
  for (const item of documentsInput) {
    if (!item || typeof item !== 'object') {
      return errorResponse('Invalid document payload', 'VALIDATION_FAILED', 400)
    }

    const doc = item as Record<string, unknown>
    const docType = getOptionalString(doc.doc_type)
    const fileName = getOptionalString(doc.file_name)
    const fileUrl = getOptionalString(doc.file_url)
    const fileSize =
      doc.file_size === null || doc.file_size === undefined
        ? undefined
        : Number(doc.file_size)

    if (!docType || !fileName || !fileUrl) {
      return errorResponse(
        'Each document must include type, file name, and URL',
        'VALIDATION_FAILED',
        400,
      )
    }

    if (
      fileSize !== undefined &&
      (!Number.isFinite(fileSize) || fileSize <= 0)
    ) {
      return errorResponse('Document file size must be positive', 'VALIDATION_FAILED', 400)
    }

    documents.push({
      doc_type: docType,
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize,
    })
  }

  const payload = {
    borrower_id: user.id,
    loan_product_id: loanProductId,
    amount,
    tenure_months: tenureMonths,
    purpose,
    employment_status: employmentStatus as EmploymentStatus,
    annual_income: annualIncome,
    employer_name: employerName,
    self_reported_credit_score: creditScore,
    existing_loans: existingLoans,
    additional_notes: additionalNotes,
  }

  const { data, error } = await supabase.from('loan_applications').insert(payload).select('*').single()

  if (error) {
    return errorResponse(error.message, 'CREATE_FAILED', 500)
  }

  if (documents.length) {
    const { error: documentsError } = await supabase.from('documents').insert(
      documents.map((document) => ({
        application_id: data.id,
        borrower_id: user.id,
        ...document,
      })),
    )

    if (documentsError) {
      return errorResponse(documentsError.message, 'DOCUMENT_INSERT_FAILED', 500)
    }
  }

  await supabase.from('audit_logs').insert({
    application_id: data.id,
    performed_by: user.id,
    action: 'application_submitted',
    new_value: {
      status: 'pending',
      amount,
      tenure_months: tenureMonths,
    },
  })

  const { data: officers } = await supabase.from('profiles').select('id').in('role', ['officer', 'admin'])

  if (officers?.length) {
    await supabase.from('notifications').insert(
      officers.map((officer) => ({
        user_id: officer.id,
        application_id: data.id,
        title: 'New loan application received',
        message: `New loan application from ${profile.full_name} for ₹${amount.toLocaleString('en-IN')}.`,
        type: 'general',
      })),
    )
  }

  return successResponse(data, 'Application created successfully', 201)
}
