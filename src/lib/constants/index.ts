import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Briefcase,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  Package,
  PlusCircle,
  Shield,
  Upload,
} from 'lucide-react'

import type {
  ApplicationStatus,
  AIDecision,
  DocType,
  EmploymentStatus,
  LoanType,
  NotificationType,
} from '@/types'

export const APP_NAME = 'LendFlow'

export const loanPurposeOptions = [
  'Home Renovation',
  'Education',
  'Medical Emergency',
  'Wedding',
  'Travel',
  'Debt Consolidation',
  'Business Expansion',
  'Vehicle Purchase',
  'Other',
]

export const employmentOptions: {
  label: string
  value: EmploymentStatus
  description: string
}[] = [
  { label: 'Salaried', value: 'salaried', description: 'Fixed monthly salary' },
  { label: 'Self Employed', value: 'self_employed', description: 'Independent professional' },
  { label: 'Business Owner', value: 'business_owner', description: 'Owns a registered business' },
  { label: 'Student', value: 'student', description: 'Currently enrolled in studies' },
  { label: 'Unemployed', value: 'unemployed', description: 'No current employment' },
]

export const existingLoanOptions = [
  'None',
  'Under ₹2L',
  '₹2L-₹5L',
  '₹5L-₹10L',
  'Above ₹10L',
]

export const documentRequirements: Record<EmploymentStatus, { label: string; type: DocType }[]> = {
  salaried: [
    { label: 'Identity Proof', type: 'identity' },
    { label: 'Address Proof', type: 'address_proof' },
    { label: 'Salary Slip (Last 3 Months)', type: 'income_proof' },
    { label: 'Bank Statement', type: 'bank_statement' },
  ],
  self_employed: [
    { label: 'Identity Proof', type: 'identity' },
    { label: 'Address Proof', type: 'address_proof' },
    { label: 'ITR / Income Proof', type: 'income_proof' },
    { label: 'Bank Statement', type: 'bank_statement' },
  ],
  business_owner: [
    { label: 'Identity Proof', type: 'identity' },
    { label: 'Address Proof', type: 'address_proof' },
    { label: 'ITR / Income Proof', type: 'income_proof' },
    { label: 'Bank Statement', type: 'bank_statement' },
  ],
  student: [
    { label: 'Identity Proof', type: 'identity' },
    { label: 'Address Proof', type: 'address_proof' },
    { label: 'College ID / Income Proof', type: 'income_proof' },
    { label: 'Employment / Sponsorship Letter', type: 'employment_letter' },
  ],
  unemployed: [
    { label: 'Identity Proof', type: 'identity' },
    { label: 'Address Proof', type: 'address_proof' },
  ],
}

export const statusStyles: Record<ApplicationStatus, string> = {
  pending: 'bg-[#FEF6E4] text-[#92610A]',
  under_review: 'bg-[#EAF2FF] text-[#1D5FA6]',
  additional_info_required: 'bg-[#FFF3E8] text-[#AD5A00]',
  approved: 'bg-[#E8F5EE] text-[#1A7F4B]',
  rejected: 'bg-[#FDEEEE] text-[#C0392B]',
  disbursed: 'bg-[#F0EBFF] text-[#5B30A6]',
  cancelled: 'bg-[#F8FAFC] text-[#718096]',
}

export const aiDecisionStyles: Record<AIDecision, string> = {
  approve: 'bg-[#E8F5EE] text-[#1A7F4B]',
  manual_review: 'bg-[#FEF6E4] text-[#92610A]',
  reject: 'bg-[#FDEEEE] text-[#C0392B]',
}

export const notificationIcons: Record<NotificationType, typeof Bell> = {
  status_update: Activity,
  document_request: Upload,
  decision: Brain,
  reminder: Bell,
  general: Shield,
}

export const borrowerNavItems = [
  { href: '/borrower/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/borrower/apply', label: 'Apply for Loan', icon: PlusCircle },
  { href: '/borrower/applications', label: 'My Applications', icon: FileText },
  { href: '/borrower/documents', label: 'Documents', icon: Upload },
  { href: '/borrower/notifications', label: 'Notifications', icon: Bell },
]

export const officerNavItems = [
  { href: '/officer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/officer/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/officer/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/officer/loan-products', label: 'Loan Products', icon: Package },
]

export const landingFeatureCards = [
  {
    title: 'Digital Application Portal',
    description: 'Borrowers can submit applications, track status, and manage documents in one secure workflow.',
    icon: Brain,
  },
  {
    title: 'Real-time Tracking',
    description: 'Monitor every application stage with live progress, notifications, and audit-backed updates.',
    icon: Activity,
  },
  {
    title: 'Officer Review Workspace',
    description: 'Loan officers review cases, verify documents, and make final approval or rejection decisions.',
    icon: Shield,
  },
]

export const authRoleCards = [
  {
    value: 'borrower',
    label: 'I want to apply for a loan',
    description: 'Submit applications, upload documents, and track decisions.',
    icon: Briefcase,
  },
  {
    value: 'officer',
    label: 'I am a Loan Officer',
    description: 'Review applications, inspect AI output, and make final decisions.',
    icon: Shield,
  },
] as const

export const loanTypeLabels: Record<LoanType, string> = {
  personal: 'Personal Loan',
  home: 'Home Loan',
  auto: 'Auto Loan',
  business: 'Business Loan',
  education: 'Education Loan',
}
