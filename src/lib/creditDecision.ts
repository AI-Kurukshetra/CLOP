import { calculateEMI } from '@/lib/utils/calculateEMI'
import type { AIDecisionResult, EmploymentStatus } from '@/types'

type CreditDecisionInput = {
  amount: number
  annual_income: number
  tenure_months: number
  self_reported_credit_score?: number | null
  employment_status: EmploymentStatus
  interest_rate: number
  base_rate: number
}

export function calculateCreditDecision(application: CreditDecisionInput): AIDecisionResult {
  const monthlyIncome = application.annual_income / 12
  const emi = calculateEMI(application.amount, application.interest_rate, application.tenure_months).emi
  const emiRatio = (emi / monthlyIncome) * 100
  const loanToIncome = application.amount / application.annual_income
  const score = application.self_reported_credit_score || 650

  if (emiRatio > 50) {
    return {
      decision: 'reject',
      confidence: 90,
      risk_level: 'very_high',
      reasoning: 'EMI exceeds 50% of monthly income.',
      red_flags: ['High EMI-to-income ratio'],
      key_factors: [],
      suggested_rate: null,
      max_recommended_amount: 0,
    }
  }

  if (score < 600) {
    return {
      decision: 'reject',
      confidence: 85,
      risk_level: 'very_high',
      reasoning: 'Credit score below minimum threshold of 600.',
      red_flags: ['Low credit score'],
      key_factors: [],
      suggested_rate: null,
      max_recommended_amount: 0,
    }
  }

  if (application.employment_status === 'unemployed') {
    return {
      decision: 'reject',
      confidence: 95,
      risk_level: 'very_high',
      reasoning: 'Unemployed applicants do not meet eligibility.',
      red_flags: ['No income source'],
      key_factors: [],
      suggested_rate: null,
      max_recommended_amount: 0,
    }
  }

  if (score >= 600 && score < 700) {
    return {
      decision: 'manual_review',
      confidence: 60,
      risk_level: 'medium',
      reasoning: 'Credit score in fair range. Manual verification required.',
      red_flags: [],
      key_factors: ['Moderate credit score'],
      suggested_rate: application.base_rate + 2.5,
      max_recommended_amount: Math.round(Math.min(application.amount, application.annual_income * 4)),
    }
  }

  if (application.employment_status === 'self_employed') {
    return {
      decision: 'manual_review',
      confidence: 65,
      risk_level: 'medium',
      reasoning: 'Self-employed income requires ITR verification.',
      red_flags: [],
      key_factors: ['Self-employed'],
      suggested_rate: application.base_rate + 2,
      max_recommended_amount: Math.round(Math.min(application.amount, application.annual_income * 4.5)),
    }
  }

  if (loanToIncome > 5) {
    return {
      decision: 'manual_review',
      confidence: 55,
      risk_level: 'high',
      reasoning: 'Loan amount exceeds 5x annual income.',
      red_flags: ['High loan-to-income ratio'],
      key_factors: [],
      suggested_rate: application.base_rate + 3,
      max_recommended_amount: Math.round(application.annual_income * 5),
    }
  }

  return {
    decision: 'approve',
    confidence: score > 750 ? 88 : 75,
    risk_level: score > 750 ? 'low' : 'medium',
    reasoning: 'Applicant meets all eligibility criteria.',
    red_flags: [],
    key_factors: ['Good credit score', 'Stable income', 'Acceptable EMI ratio'],
    suggested_rate: score > 750 ? application.base_rate : application.base_rate + 1,
    max_recommended_amount: application.amount,
  }
}
