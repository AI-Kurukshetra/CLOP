'use client'

import { startTransition, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { employmentOptions, existingLoanOptions, loanPurposeOptions } from '@/lib/constants'
import { calculateEMI } from '@/lib/utils/calculateEMI'
import { formatINR } from '@/lib/utils/formatCurrency'
import type { EmploymentStatus, LoanProduct } from '@/types'
import { parseJsonResponse } from '@/lib/utils/api'

const steps = ['Loan Details', 'Personal & Employment', 'Review & Submit']

type FormState = {
  loan_product_id: string
  amount: number
  tenure_months: number
  purpose: string
  employment_status: EmploymentStatus
  annual_income: number
  employer_name: string
  self_reported_credit_score: number
  existing_loans: string
  additional_notes: string
}

export function ApplicationForm({ products }: { products: LoanProduct[] }) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [decisionModal, setDecisionModal] = useState<null | Record<string, unknown>>(null)
  const [values, setValues] = useState<FormState>({
    loan_product_id: products[0]?.id ?? '',
    amount: products[0]?.min_amount ?? 0,
    tenure_months: products[0]?.min_tenure_months ?? 12,
    purpose: loanPurposeOptions[0],
    employment_status: 'salaried',
    annual_income: 0,
    employer_name: '',
    self_reported_credit_score: 700,
    existing_loans: existingLoanOptions[0],
    additional_notes: '',
  })

  const product = products.find((item) => item.id === values.loan_product_id) ?? products[0]
  const emi = useMemo(
    () => calculateEMI(values.amount, product?.base_interest_rate ?? 0, values.tenure_months),
    [product?.base_interest_rate, values.amount, values.tenure_months],
  )

  const handleSubmit = async () => {
    if (!product) {
      toast.error('Select a loan product first.')
      return
    }

    if (!confirm) {
      toast.error('Please confirm the application details.')
      return
    }

    setLoading(true)

    try {
      const applicationResponse = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const applicationBody = await parseJsonResponse<{ data: { id: string } }>(applicationResponse)

      const decisionResponse = await fetch(`/api/applications/${applicationBody.data.id}/decision`, {
        method: 'POST',
      })
      const decisionBody = await parseJsonResponse<{ data: Record<string, unknown> }>(decisionResponse)

      setDecisionModal({ ...decisionBody.data, applicationId: applicationBody.data.id })
      toast.success('Application submitted successfully.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setStep((current) => Math.min(current + 1, steps.length - 1))
  const previousStep = () => setStep((current) => Math.max(current - 1, 0))

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-200">
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((label, index) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${index <= step ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-xs text-[#718096]">Step {index + 1}</p>
                  <p className="text-sm font-medium text-[#1A202C]">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-8 p-5">
          {step === 0 ? (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div>
                  <Label>Loan Product</Label>
                  <Select value={values.loan_product_id} onValueChange={(value) => {
                    const selected = products.find((item) => item.id === value)
                    setValues((current) => ({
                      ...current,
                      loan_product_id: value,
                      amount: selected?.min_amount ?? current.amount,
                      tenure_months: selected?.min_tenure_months ?? current.tenure_months,
                    }))
                  }}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Loan Amount</Label>
                  <Input type="number" value={values.amount} onChange={(event) => setValues((current) => ({ ...current, amount: Number(event.target.value) }))} />
                </div>
                <div>
                  <Label>Loan Tenure (months)</Label>
                  <Input type="number" value={values.tenure_months} onChange={(event) => setValues((current) => ({ ...current, tenure_months: Number(event.target.value) }))} />
                </div>
                <div>
                  <Label>Loan Purpose</Label>
                  <Select value={values.purpose} onValueChange={(value) => setValues((current) => ({ ...current, purpose: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {loanPurposeOptions.map((purpose) => (
                        <SelectItem key={purpose} value={purpose}>
                          {purpose}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Card className="bg-[#F8FAFC]">
                <CardHeader>
                  <CardTitle>EMI Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Monthly EMI</p>
                    <p className="text-2xl font-bold text-slate-900">{formatINR(emi.emi)}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Total Interest</p>
                      <p className="text-sm font-semibold text-slate-900">{formatINR(emi.total_interest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Payment</p>
                      <p className="text-sm font-semibold text-slate-900">{formatINR(emi.total_payment)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Interest Rate</p>
                      <p className="text-sm font-semibold text-slate-900">{product?.base_interest_rate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Eligible Range</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatINR(product?.min_amount ?? 0)} - {formatINR(product?.max_amount ?? 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {employmentOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`rounded-2xl border p-4 text-left ${values.employment_status === option.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
                    onClick={() => setValues((current) => ({ ...current, employment_status: option.value }))}
                    type="button"
                  >
                    <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{option.description}</p>
                  </button>
                ))}
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label>Annual Income</Label>
                  <Input className="mt-2" type="number" value={values.annual_income} onChange={(event) => setValues((current) => ({ ...current, annual_income: Number(event.target.value) }))} />
                </div>
                {!['student', 'unemployed'].includes(values.employment_status) ? (
                  <div>
                    <Label>Employer / Business Name</Label>
                    <Input className="mt-2" value={values.employer_name} onChange={(event) => setValues((current) => ({ ...current, employer_name: event.target.value }))} />
                  </div>
                ) : null}
                <div>
                  <Label>Self-reported Credit Score</Label>
                  <Input className="mt-2" type="range" min={300} max={900} value={values.self_reported_credit_score} onChange={(event) => setValues((current) => ({ ...current, self_reported_credit_score: Number(event.target.value) }))} />
                  <p className="mt-2 text-sm text-slate-600">{values.self_reported_credit_score}</p>
                </div>
                <div>
                  <Label>Existing Loans</Label>
                  <Select value={values.existing_loans} onValueChange={(value) => setValues((current) => ({ ...current, existing_loans: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {existingLoanOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Additional Notes</Label>
                <Textarea className="mt-2" value={values.additional_notes} onChange={(event) => setValues((current) => ({ ...current, additional_notes: event.target.value }))} />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Product</p>
                      <p className="text-sm font-semibold text-slate-900">{product?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Purpose</p>
                      <p className="text-sm font-semibold text-slate-900">{values.purpose}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Amount</p>
                      <p className="text-sm font-semibold text-slate-900">{formatINR(values.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tenure</p>
                      <p className="text-sm font-semibold text-slate-900">{values.tenure_months} months</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Employment</p>
                      <p className="text-sm font-semibold text-slate-900">{values.employment_status.replaceAll('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Annual Income</p>
                      <p className="text-sm font-semibold text-slate-900">{formatINR(values.annual_income)}</p>
                    </div>
                  </CardContent>
                </Card>
                <label className="flex items-start gap-3 rounded-lg border border-[#E8ECF0] bg-white p-4">
                  <Checkbox checked={confirm} onChange={(event) => setConfirm(event.target.checked)} />
                  <span className="text-sm text-[#4A5568]">I confirm all information provided is true and accurate.</span>
                </label>
              </div>
              <Card className="bg-[#F8FAFC]">
                <CardHeader>
                  <CardTitle>EMI Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500">Monthly EMI</p>
                    <p className="text-2xl font-bold text-slate-900">{formatINR(emi.emi)}</p>
                  </div>
                  <div className="rounded-md border border-[#E8ECF0] bg-white p-4">
                    <p className="text-sm font-medium text-[#1A202C]">Next step after submission</p>
                    <p className="mt-2 text-sm text-[#4A5568]">
                      Upload supporting documents from the Documents page after the application is created.
                    </p>
                  </div>
                  <LoadingButton className="w-full" loading={loading} onClick={() => startTransition(() => void handleSubmit())}>
                    {loading ? 'Submitting application...' : 'Submit application'}
                  </LoadingButton>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-[#F0F2F5] pt-6 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={previousStep} disabled={step === 0}>
              Previous
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(decisionModal)} onOpenChange={(open) => !open && setDecisionModal(null)}>
        <DialogContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-[#EAF2FF] p-3">
                <Sparkles className="h-5 w-5 text-[#1D5FA6]" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">AI Decision Ready</p>
                <p className="text-sm text-slate-500">Our AI has completed the initial underwriting pass.</p>
              </div>
            </div>
            <div className="rounded-lg border border-[#E8ECF0] bg-[#F8FAFC] p-5">
              <p className="text-sm font-medium text-slate-700">
                Decision: {String(decisionModal?.decision ?? '').replaceAll('_', ' ')}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{String(decisionModal?.reasoning ?? '')}</p>
              {decisionModal?.suggested_rate ? (
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Suggested interest rate: {String(decisionModal.suggested_rate)}%
                </p>
              ) : null}
            </div>
            <p className="text-xs text-[#718096]">
              Upload documents separately from the Documents page after the application is created.
            </p>
            <Button asChild className="w-full">
              <Link href={`/borrower/applications/${decisionModal?.applicationId}`}>View Application Details</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
