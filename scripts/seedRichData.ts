import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

type ProfileRow = {
  id: string
  full_name: string
  role: 'borrower' | 'officer' | 'admin'
}

type LoanProductRow = {
  id: string
  name: string
  type: 'personal' | 'home' | 'auto' | 'business' | 'education'
  min_amount: number
  max_amount: number
  min_tenure_months: number
  max_tenure_months: number
  base_interest_rate: number
  is_active: boolean
}

type EmploymentStatus =
  | 'salaried'
  | 'self_employed'
  | 'business_owner'
  | 'unemployed'
  | 'student'

type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'additional_info_required'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'cancelled'

function loadLocalEnvFile(fileName: string) {
  const filePath = path.join(process.cwd(), fileName)
  if (!fs.existsSync(filePath)) {
    return
  }

  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    if (!key || key in process.env) {
      continue
    }

    let value = line.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function withOffsetDays(baseDate: Date, days: number): string {
  return new Date(baseDate.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

function nearestStep(value: number, step: number) {
  return Math.round(value / step) * step
}

function deriveApplicationFields(
  status: ApplicationStatus,
  baseRate: number,
  amount: number,
  tenureMonths: number,
  officerId: string,
) {
  const now = new Date()
  const reviewedAt = withOffsetDays(now, 1)
  const decisionAt = withOffsetDays(now, 1)

  if (status === 'approved' || status === 'disbursed') {
    return {
      ai_decision: 'approve',
      ai_confidence: 82,
      ai_risk_level: 'low',
      ai_reasoning: 'Income and credit profile are aligned with policy.',
      ai_suggested_rate: baseRate + 0.5,
      ai_key_factors: ['Stable income', 'Good credit score', 'Healthy repayment ratio'],
      ai_red_flags: [] as string[],
      officer_id: officerId,
      officer_notes:
        status === 'disbursed'
          ? 'Approved and moved to disbursal after final checks.'
          : 'Approved by officer after document verification.',
      approved_amount: amount,
      approved_rate: Number((baseRate + 0.75).toFixed(2)),
      approved_tenure_months: tenureMonths,
      reviewed_at: reviewedAt,
      decision_at: decisionAt,
    }
  }

  if (status === 'rejected') {
    return {
      ai_decision: 'reject',
      ai_confidence: 78,
      ai_risk_level: 'high',
      ai_reasoning: 'Debt burden and risk signals exceed policy thresholds.',
      ai_suggested_rate: null,
      ai_key_factors: [] as string[],
      ai_red_flags: ['High repayment burden', 'Recent credit stress markers'],
      officer_id: officerId,
      officer_notes: 'Rejected after manual review of risk and affordability.',
      approved_amount: null,
      approved_rate: null,
      approved_tenure_months: null,
      reviewed_at: reviewedAt,
      decision_at: decisionAt,
    }
  }

  if (status === 'additional_info_required') {
    return {
      ai_decision: 'manual_review',
      ai_confidence: 64,
      ai_risk_level: 'medium',
      ai_reasoning: 'Case needs additional proofs for income continuity.',
      ai_suggested_rate: baseRate + 1.75,
      ai_key_factors: ['Moderate score', 'Incomplete documentation'],
      ai_red_flags: ['Missing proof of income'],
      officer_id: officerId,
      officer_notes:
        'Please upload latest salary slips and 6-month bank statement.',
      approved_amount: null,
      approved_rate: null,
      approved_tenure_months: null,
      reviewed_at: reviewedAt,
      decision_at: null,
    }
  }

  if (status === 'under_review') {
    return {
      ai_decision: 'manual_review',
      ai_confidence: 66,
      ai_risk_level: 'medium',
      ai_reasoning: 'Application routed for officer review.',
      ai_suggested_rate: baseRate + 1.5,
      ai_key_factors: ['Needs income verification'],
      ai_red_flags: [] as string[],
      officer_id: officerId,
      officer_notes: 'Under review by credit operations.',
      approved_amount: null,
      approved_rate: null,
      approved_tenure_months: null,
      reviewed_at: reviewedAt,
      decision_at: null,
    }
  }

  if (status === 'cancelled') {
    return {
      ai_decision: 'manual_review',
      ai_confidence: 50,
      ai_risk_level: 'medium',
      ai_reasoning: 'Application was cancelled before final decision.',
      ai_suggested_rate: baseRate + 2,
      ai_key_factors: ['Cancelled by applicant'],
      ai_red_flags: [] as string[],
      officer_id: officerId,
      officer_notes: 'Application cancelled by borrower request.',
      approved_amount: null,
      approved_rate: null,
      approved_tenure_months: null,
      reviewed_at: reviewedAt,
      decision_at: decisionAt,
    }
  }

  return {
    ai_decision: 'manual_review',
    ai_confidence: 60,
    ai_risk_level: 'medium',
    ai_reasoning: 'Pending case in queue for underwriting.',
    ai_suggested_rate: baseRate + 1.25,
    ai_key_factors: ['Queued for officer review'],
    ai_red_flags: [] as string[],
    officer_id: null,
    officer_notes: null,
    approved_amount: null,
    approved_rate: null,
    approved_tenure_months: null,
    reviewed_at: null,
    decision_at: null,
  }
}

async function run() {
  loadLocalEnvFile('.env')
  loadLocalEnvFile('.env.local')

  const supabase = createClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['borrower', 'officer', 'admin'])

  if (profileError || !profileRows?.length) {
    throw profileError ?? new Error('No profiles found. Run npm run seed first.')
  }

  const borrowers = (profileRows as ProfileRow[]).filter(
    (profile) => profile.role === 'borrower',
  )
  const officers = (profileRows as ProfileRow[]).filter(
    (profile) => profile.role === 'officer' || profile.role === 'admin',
  )

  if (!borrowers.length || !officers.length) {
    throw new Error('Need at least one borrower and one officer profile.')
  }

  const { data: loanProducts, error: productError } = await supabase
    .from('loan_products')
    .select(
      'id, name, type, min_amount, max_amount, min_tenure_months, max_tenure_months, base_interest_rate, is_active',
    )
    .eq('is_active', true)
    .order('name')

  if (productError || !loanProducts?.length) {
    throw productError ?? new Error('No active loan products found.')
  }

  const products = loanProducts as LoanProductRow[]
  const markerPrefix = 'demo-rich-v1-case-'
  const totalCases = 30
  const caseMarkers = Array.from({ length: totalCases }, (_, index) => {
    return `${markerPrefix}${String(index + 1).padStart(2, '0')}`
  })

  const { data: existingCases, error: existingCasesError } = await supabase
    .from('loan_applications')
    .select('additional_notes')
    .in('additional_notes', caseMarkers)

  if (existingCasesError) {
    throw existingCasesError
  }

  const existingMarkerSet = new Set(
    (existingCases ?? [])
      .map((row) => row.additional_notes)
      .filter((value): value is string => typeof value === 'string'),
  )

  const statusRotation: ApplicationStatus[] = [
    'pending',
    'under_review',
    'additional_info_required',
    'approved',
    'rejected',
    'disbursed',
    'cancelled',
  ]

  const employmentRotation: EmploymentStatus[] = [
    'salaried',
    'self_employed',
    'business_owner',
    'salaried',
    'student',
    'unemployed',
  ]

  const purposePool = [
    'Home renovation and interiors',
    'Education program fee and living expenses',
    'Business inventory purchase',
    'Medical treatment and recovery costs',
    'Vehicle purchase and registration',
    'Debt consolidation',
    'Working capital requirement',
    'Wedding expenses',
    'Professional certification course',
    'Emergency household repairs',
  ]

  const now = new Date()
  const officer = officers[0]
  const applicationRows: Array<Record<string, unknown>> = []
  const applicationMeta: Array<{
    marker: string
    status: ApplicationStatus
    borrower: ProfileRow
  }> = []

  for (let i = 0; i < totalCases; i += 1) {
    const marker = caseMarkers[i]
    if (existingMarkerSet.has(marker)) {
      continue
    }

    const borrower = borrowers[i % borrowers.length]
    const product = products[i % products.length]
    const status = statusRotation[i % statusRotation.length]
    const employmentStatus = employmentRotation[i % employmentRotation.length]

    const amountSpan = product.max_amount - product.min_amount
    const amountRatio = ((i * 13 + 17) % 100) / 100
    const rawAmount = product.min_amount + amountSpan * amountRatio
    const amount = clamp(nearestStep(rawAmount, 5000), product.min_amount, product.max_amount)

    const tenureSpan = product.max_tenure_months - product.min_tenure_months
    const tenureMonths =
      product.min_tenure_months +
      (tenureSpan > 0 ? ((i * 7 + 3) % (tenureSpan + 1)) : 0)

    const createdAt = withOffsetDays(now, (i + 2) * 2)
    const annualIncomeBase = Math.max(300000, Math.round(amount * (1.6 + (i % 4) * 0.35)))
    const annualIncome = annualIncomeBase + (i % 3) * 45000
    const creditScore = clamp(590 + ((i * 17) % 260), 520, 860)

    const derived = deriveApplicationFields(
      status,
      Number(product.base_interest_rate),
      amount,
      tenureMonths,
      officer.id,
    )

    applicationRows.push({
      borrower_id: borrower.id,
      loan_product_id: product.id,
      amount,
      tenure_months: tenureMonths,
      purpose: purposePool[i % purposePool.length],
      employment_status: employmentStatus,
      annual_income: annualIncome,
      employer_name:
        employmentStatus === 'salaried'
          ? `Company ${String.fromCharCode(65 + (i % 26))}`
          : employmentStatus === 'business_owner' || employmentStatus === 'self_employed'
            ? `Venture ${i + 1}`
            : null,
      self_reported_credit_score: creditScore,
      existing_loans: i % 5 === 0 ? 'Above ₹10L' : i % 2 === 0 ? 'Under ₹2L' : 'None',
      status,
      ai_decision: derived.ai_decision,
      ai_confidence: derived.ai_confidence,
      ai_risk_level: derived.ai_risk_level,
      ai_reasoning: derived.ai_reasoning,
      ai_suggested_rate: derived.ai_suggested_rate,
      ai_key_factors: derived.ai_key_factors,
      ai_red_flags: derived.ai_red_flags,
      officer_id: derived.officer_id,
      officer_notes: derived.officer_notes,
      approved_amount: derived.approved_amount,
      approved_rate: derived.approved_rate,
      approved_tenure_months: derived.approved_tenure_months,
      reviewed_at: derived.reviewed_at,
      decision_at: derived.decision_at,
      created_at: createdAt,
      additional_notes: marker,
    })
    applicationMeta.push({ marker, status, borrower })
  }

  if (!applicationRows.length) {
    console.info('Rich demo cases already exist. No new rows inserted.')
    return
  }

  const { data: insertedApplications, error: insertError } = await supabase
    .from('loan_applications')
    .insert(applicationRows)
    .select('id, borrower_id, status, additional_notes')

  if (insertError || !insertedApplications?.length) {
    throw insertError ?? new Error('Failed to insert rich demo applications.')
  }

  const markerToStatus = new Map(applicationMeta.map((item) => [item.marker, item.status]))
  const markerToBorrower = new Map(
    applicationMeta.map((item) => [item.marker, item.borrower]),
  )

  const documents: Array<Record<string, unknown>> = []
  const notifications: Array<Record<string, unknown>> = []
  const auditLogs: Array<Record<string, unknown>> = []

  for (let index = 0; index < insertedApplications.length; index += 1) {
    const application = insertedApplications[index]
    const marker = application.additional_notes ?? ''
    const status = markerToStatus.get(marker) ?? application.status
    const borrower = markerToBorrower.get(marker)

    const shouldHaveDocs = index % 3 !== 0
    if (shouldHaveDocs) {
      documents.push(
        {
          application_id: application.id,
          borrower_id: application.borrower_id,
          doc_type: 'identity',
          file_name: `id-proof-${application.id.slice(0, 8)}.pdf`,
          file_url: `https://example.com/demo-documents/${application.id}/identity.pdf`,
          file_size: 240000 + index * 900,
          verified: status === 'approved' || status === 'disbursed',
          uploaded_at: withOffsetDays(now, (index + 2) * 2 - 1),
        },
        {
          application_id: application.id,
          borrower_id: application.borrower_id,
          doc_type: 'bank_statement',
          file_name: `bank-statement-${application.id.slice(0, 8)}.pdf`,
          file_url: `https://example.com/demo-documents/${application.id}/bank-statement.pdf`,
          file_size: 360000 + index * 1200,
          verified: status === 'approved' || status === 'disbursed',
          uploaded_at: withOffsetDays(now, (index + 2) * 2 - 1),
        },
      )
    }

    notifications.push(
      {
        user_id: application.borrower_id,
        application_id: application.id,
        title: 'Application status updated',
        message: `Your application is currently ${String(status).replaceAll('_', ' ')}.`,
        type:
          status === 'additional_info_required'
            ? 'document_request'
            : status === 'approved' || status === 'rejected' || status === 'disbursed'
              ? 'decision'
              : 'status_update',
      },
      {
        user_id: officer.id,
        application_id: application.id,
        title: 'New application in pipeline',
        message: `Case from ${borrower?.full_name ?? 'Borrower'} moved to ${String(status).replaceAll('_', ' ')}.`,
        type: 'general',
      },
    )

    auditLogs.push({
      application_id: application.id,
      performed_by: application.borrower_id,
      action: 'application_submitted',
      new_value: { status: 'pending' },
      created_at: withOffsetDays(now, (index + 2) * 2),
    })

    auditLogs.push({
      application_id: application.id,
      performed_by: officer.id,
      action:
        status === 'approved'
          ? 'approve'
          : status === 'rejected'
            ? 'reject'
            : status === 'additional_info_required'
              ? 'request_info'
              : status === 'disbursed'
                ? 'disburse'
                : 'review_update',
      new_value: { status },
      created_at: withOffsetDays(now, (index + 2) * 2 - 1),
    })
  }

  if (documents.length) {
    const { error: documentError } = await supabase.from('documents').insert(documents)
    if (documentError) {
      throw documentError
    }
  }

  if (notifications.length) {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications)
    if (notificationError) {
      throw notificationError
    }
  }

  if (auditLogs.length) {
    const { error: auditError } = await supabase.from('audit_logs').insert(auditLogs)
    if (auditError) {
      throw auditError
    }
  }

  console.info(
    `Inserted ${insertedApplications.length} applications, ${documents.length} documents, ${notifications.length} notifications, and ${auditLogs.length} audit logs.`,
  )
  console.info('Rich demo seed complete.')
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown rich seed error'
  console.error(`Rich seed failed: ${message}`)
  process.exit(1)
})
