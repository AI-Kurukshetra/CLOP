import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

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

loadLocalEnvFile('.env')
loadLocalEnvFile('.env.local')

type UserSeed = {
  email: string
  password: string
  full_name: string
  role: 'borrower' | 'officer'
  phone: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const loanProducts = [
  {
    name: 'Personal Loan',
    type: 'personal',
    min_amount: 50000,
    max_amount: 1000000,
    min_tenure_months: 12,
    max_tenure_months: 60,
    base_interest_rate: 12.5,
    is_active: true,
  },
  {
    name: 'Home Loan',
    type: 'home',
    min_amount: 1000000,
    max_amount: 50000000,
    min_tenure_months: 60,
    max_tenure_months: 300,
    base_interest_rate: 8.75,
    is_active: true,
  },
  {
    name: 'Auto Loan',
    type: 'auto',
    min_amount: 100000,
    max_amount: 3000000,
    min_tenure_months: 12,
    max_tenure_months: 84,
    base_interest_rate: 10.25,
    is_active: true,
  },
  {
    name: 'Education Loan',
    type: 'education',
    min_amount: 100000,
    max_amount: 5000000,
    min_tenure_months: 12,
    max_tenure_months: 120,
    base_interest_rate: 9.5,
    is_active: true,
  },
]

const demoUsers: UserSeed[] = [
  {
    email: 'borrower@demo.com',
    password: 'Demo@1234',
    full_name: 'Priya Sharma',
    role: 'borrower',
    phone: '+91 9876543210',
  },
  {
    email: 'borrower2@demo.com',
    password: 'Demo@1234',
    full_name: 'Rahul Mehta',
    role: 'borrower',
    phone: '+91 9876501234',
  },
  {
    email: 'officer@demo.com',
    password: 'Demo@1234',
    full_name: 'Anjali Verma',
    role: 'officer',
    phone: '+91 9811122233',
  },
]

async function ensureUser(user: UserSeed) {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    throw listError
  }

  const found = users.users.find((entry) => entry.email === user.email)

  if (found) {
    console.info(`User already exists: ${user.email}`)
    return found
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
  })

  if (error || !data.user) {
    throw error ?? new Error(`Failed to create ${user.email}`)
  }

  console.info(`Created auth user: ${user.email}`)
  return data.user
}

async function ensureProfile(userId: string, user: UserSeed) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  })

  if (error) {
    throw error
  }

  console.info(`Upserted profile: ${user.email}`)
}

async function ensureLoanProducts() {
  const seededProducts: Array<Record<string, unknown>> = []

  for (const product of loanProducts) {
    const { data: existing, error: existingError } = await supabase
      .from('loan_products')
      .select('*')
      .eq('name', product.name)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('loan_products')
        .update(product)
        .eq('id', existing.id)
        .select('*')
        .single()

      if (updateError || !updated) {
        throw updateError ?? new Error(`Failed to update product: ${product.name}`)
      }

      seededProducts.push(updated)
      continue
    }

    const { data: inserted, error: insertError } = await supabase
      .from('loan_products')
      .insert(product)
      .select('*')
      .single()

    if (insertError || !inserted) {
      throw insertError ?? new Error(`Failed to insert product: ${product.name}`)
    }

    seededProducts.push(inserted)
  }

  console.info(`Upserted ${seededProducts.length} loan products`)
  return seededProducts
}

async function run() {
  console.info('Starting seed...')

  const seededUsers = await Promise.all(
    demoUsers.map(async (user) => {
      const authUser = await ensureUser(user)
      await ensureProfile(authUser.id, user)
      return { ...user, id: authUser.id }
    }),
  )

  const products = await ensureLoanProducts()
  const priya = seededUsers.find((user) => user.email === 'borrower@demo.com')
  const rahul = seededUsers.find((user) => user.email === 'borrower2@demo.com')
  const officer = seededUsers.find((user) => user.email === 'officer@demo.com')
  const personal = products.find((product) => product.name === 'Personal Loan')
  const home = products.find((product) => product.name === 'Home Loan')
  const auto = products.find((product) => product.name === 'Auto Loan')

  if (!priya || !rahul || !officer || !personal || !home || !auto) {
    throw new Error('Seed dependencies missing after setup.')
  }

  const { data: existingDemoApplications, error: existingDemoApplicationsError } = await supabase
    .from('loan_applications')
    .select('id')
    .in('borrower_id', [priya.id, rahul.id])
    .limit(1)

  if (existingDemoApplicationsError) {
    throw existingDemoApplicationsError
  }

  if (existingDemoApplications?.length) {
    console.info('Demo applications already exist, skipping application/notification/audit inserts.')
    console.info('Seed complete.')
    return
  }

  const applications = [
    {
      borrower_id: priya.id,
      loan_product_id: personal.id,
      amount: 350000,
      tenure_months: 36,
      purpose: 'home renovation',
      employment_status: 'salaried',
      annual_income: 840000,
      employer_name: 'Infosys Ltd',
      self_reported_credit_score: 762,
      existing_loans: 'None',
      status: 'approved',
      ai_decision: 'approve',
      ai_confidence: 87,
      ai_risk_level: 'low',
      ai_reasoning:
        'Strong credit score of 762 with stable salaried employment at a reputed organization. EMI to income ratio of 28% is well within acceptable limits.',
      ai_suggested_rate: 11.5,
      approved_amount: 350000,
      approved_rate: 11.5,
      approved_tenure_months: 36,
      officer_id: officer.id,
      officer_notes: 'Approved based on strong bureau profile and verified income.',
      ai_key_factors: ['High credit score', 'Stable employment', 'Low EMI-to-income ratio'],
      ai_red_flags: [],
      reviewed_at: new Date().toISOString(),
      decision_at: new Date().toISOString(),
    },
    {
      borrower_id: priya.id,
      loan_product_id: home.id,
      amount: 4500000,
      tenure_months: 240,
      purpose: 'purchase residential property',
      employment_status: 'salaried',
      annual_income: 840000,
      employer_name: 'Infosys Ltd',
      self_reported_credit_score: 762,
      existing_loans: 'Under ₹2L',
      status: 'under_review',
      ai_decision: 'manual_review',
      ai_confidence: 68,
      ai_risk_level: 'medium',
      ai_reasoning:
        'Credit profile is strong but loan amount is 5.36x annual income. Property valuation documents required before final decision.',
      ai_suggested_rate: 9.25,
      ai_key_factors: ['Good credit history', 'Stable income'],
      ai_red_flags: ['High loan-to-income ratio', 'Property docs pending'],
    },
    {
      borrower_id: rahul.id,
      loan_product_id: auto.id,
      amount: 800000,
      tenure_months: 60,
      purpose: 'purchase new vehicle',
      employment_status: 'self_employed',
      annual_income: 520000,
      self_reported_credit_score: 681,
      existing_loans: '₹2L-₹5L',
      status: 'pending',
      ai_decision: 'manual_review',
      ai_confidence: 61,
      ai_risk_level: 'medium',
      ai_reasoning:
        'Self-employed applicant with moderate credit score. Income verification through ITR documents recommended before proceeding.',
      ai_suggested_rate: 11.75,
      ai_key_factors: ['Moderate credit score', 'Reasonable loan amount'],
      ai_red_flags: ['Self-employed income verification needed'],
    },
    {
      borrower_id: rahul.id,
      loan_product_id: personal.id,
      amount: 120000,
      tenure_months: 12,
      purpose: 'medical emergency',
      employment_status: 'self_employed',
      annual_income: 520000,
      self_reported_credit_score: 581,
      existing_loans: 'Above ₹10L',
      status: 'rejected',
      ai_decision: 'reject',
      ai_confidence: 82,
      ai_risk_level: 'very_high',
      ai_reasoning:
        'Credit score of 581 falls below minimum threshold. Combined with self-employment and existing loan obligations, the risk profile does not meet current lending criteria.',
      ai_suggested_rate: null,
      ai_key_factors: [],
      ai_red_flags: [
        'Credit score below 600',
        'High existing obligations',
        'Self-employed with low income',
      ],
      officer_id: officer.id,
      officer_notes: 'Rejected due to bureau score and overall debt load.',
      reviewed_at: new Date().toISOString(),
      decision_at: new Date().toISOString(),
    },
  ]

  const { data: insertedApplications, error: applicationError } = await supabase
    .from('loan_applications')
    .insert(applications)
    .select('*')

  if (applicationError || !insertedApplications) {
    throw applicationError ?? new Error('Failed to insert applications')
  }

  console.info(`Inserted ${insertedApplications.length} loan applications`)

  const notificationRows = insertedApplications.flatMap((application) => [
    {
      user_id: officer.id,
      application_id: application.id,
      title: 'New application submitted',
      message: `New loan application from ${application.borrower_id === priya.id ? 'Priya Sharma' : 'Rahul Mehta'} for review.`,
      type: 'general',
    },
    {
      user_id: application.borrower_id,
      application_id: application.id,
      title: 'Application status updated',
      message: `Your application is currently marked as ${application.status.replaceAll('_', ' ')}.`,
      type: 'status_update',
    },
  ])

  const { error: notificationError } = await supabase
    .from('notifications')
    .insert(notificationRows)

  if (notificationError) {
    throw notificationError
  }

  console.info(`Inserted ${notificationRows.length} notifications`)

  const approvedApplication = insertedApplications.find((application) => application.status === 'approved')

  if (!approvedApplication) {
    throw new Error('Approved application missing after insert.')
  }

  const auditLogs = [
    {
      application_id: approvedApplication.id,
      performed_by: officer.id,
      action: 'application_created',
      new_value: { status: 'pending' },
    },
    {
      application_id: approvedApplication.id,
      performed_by: officer.id,
      action: 'ai_decision_recorded',
      new_value: { ai_decision: 'approve', confidence: 87 },
    },
    {
      application_id: approvedApplication.id,
      performed_by: officer.id,
      action: 'review_started',
      old_value: { status: 'pending' },
      new_value: { status: 'under_review' },
    },
    {
      application_id: approvedApplication.id,
      performed_by: officer.id,
      action: 'application_approved',
      old_value: { status: 'under_review' },
      new_value: { status: 'approved', approved_amount: 350000, approved_rate: 11.5 },
    },
  ]

  const { error: auditError } = await supabase.from('audit_logs').insert(auditLogs)

  if (auditError) {
    throw auditError
  }

  console.info(`Inserted ${auditLogs.length} audit logs`)
  console.info('Seed complete.')
}

run().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'Unknown seed error'
  console.error(`Seed failed: ${message}`)
  if (!(error instanceof Error)) {
    console.error(error)
  }
  process.exit(1)
})
