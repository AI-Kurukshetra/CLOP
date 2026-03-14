export type UserRole = 'borrower' | 'officer' | 'admin'

export type LoanType =
  | 'personal'
  | 'home'
  | 'auto'
  | 'business'
  | 'education'

export type EmploymentStatus =
  | 'salaried'
  | 'self_employed'
  | 'business_owner'
  | 'unemployed'
  | 'student'

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'additional_info_required'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'cancelled'

export type AIDecision = 'approve' | 'manual_review' | 'reject'

export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high'

export type DocType =
  | 'identity'
  | 'income_proof'
  | 'bank_statement'
  | 'address_proof'
  | 'employment_letter'
  | 'other'

export type NotificationType =
  | 'status_update'
  | 'document_request'
  | 'decision'
  | 'reminder'
  | 'general'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  phone?: string
  avatar_url?: string
  created_at: string
}

export interface LoanProduct {
  id: string
  name: string
  type: LoanType
  min_amount: number
  max_amount: number
  min_tenure_months: number
  max_tenure_months: number
  base_interest_rate: number
  is_active: boolean
  created_at: string
}

export interface LoanApplication {
  id: string
  borrower_id: string
  loan_product_id: string
  amount: number
  tenure_months: number
  purpose: string
  employment_status: EmploymentStatus
  annual_income: number
  employer_name?: string
  self_reported_credit_score?: number
  existing_loans?: string
  additional_notes?: string
  status: ApplicationStatus
  ai_decision?: AIDecision
  ai_confidence?: number
  ai_reasoning?: string
  ai_suggested_rate?: number
  ai_risk_level?: RiskLevel
  ai_key_factors?: string[]
  ai_red_flags?: string[]
  officer_id?: string
  officer_notes?: string
  approved_amount?: number
  approved_rate?: number
  approved_tenure_months?: number
  created_at: string
  updated_at: string
  reviewed_at?: string
  decision_at?: string
  borrower?: Profile
  loan_product?: LoanProduct
}

export interface Document {
  id: string
  application_id: string
  borrower_id: string
  doc_type: DocType
  file_name: string
  file_url: string
  file_size?: number
  verified: boolean
  uploaded_at: string
}

export interface Notification {
  id: string
  user_id: string
  application_id?: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  application_id: string
  performed_by: string
  action: string
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  created_at: string
}

export interface AIDecisionResult {
  decision: AIDecision
  confidence: number
  risk_level: RiskLevel
  reasoning: string
  suggested_rate: number | null
  max_recommended_amount: number
  key_factors: string[]
  red_flags: string[]
}

export interface EMICalculation {
  emi: number
  total_payment: number
  total_interest: number
}

export interface ApiSuccess<T> {
  data: T
  message: string
}

export interface ApiError {
  error: string
  code: string
}

export interface BorrowerDashboardMetrics {
  totalApplications: number
  approved: number
  pendingReview: number
  totalApprovedAmount: number
}

export interface OfficerDashboardMetrics {
  totalApplications: number
  pendingAction: number
  approvedThisMonth: number
  rejectedThisMonth: number
  approvalRate: number
}

export interface ApplicationFormValues {
  loan_product_id: string
  amount: number
  tenure_months: number
  purpose: string
  employment_status: EmploymentStatus
  annual_income: number
  employer_name?: string
  self_reported_credit_score?: number
  existing_loans?: string
  additional_notes?: string
}

export interface UploadedDocumentInput {
  doc_type: DocType
  file_name: string
  file_url: string
  file_size: number
}
