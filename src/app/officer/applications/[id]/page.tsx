'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

import { AIDecisionCard } from '@/components/applications/AIDecisionCard'
import { StatusBadge } from '@/components/applications/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { calculateEMI } from '@/lib/utils/calculateEMI'
import { formatDate, formatDateTime } from '@/lib/utils/formatDate'
import { formatINR } from '@/lib/utils/formatCurrency'
import { parseJsonResponse } from '@/lib/utils/api'
import type { ApiSuccess, LoanApplication } from '@/types'

type ReviewApplication = LoanApplication & {
  documents?: Array<Record<string, unknown>>
  audit_logs?: Array<Record<string, unknown>>
}

type ModalType = 'approve' | 'request_info' | 'reject' | null

export default function OfficerApplicationReviewPage({ params }: { params: { id: string } }) {
  const [application, setApplication] = useState<ReviewApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [modal, setModal] = useState<ModalType>(null)
  const [approvedAmount, setApprovedAmount] = useState(0)
  const [approvedRate, setApprovedRate] = useState(0)
  const [approvedTenure, setApprovedTenure] = useState(12)
  const [notes, setNotes] = useState('')

  const loadApplication = useCallback(async () => {
    const response = await fetch(`/api/applications/${params.id}`, { cache: 'no-store' })
    const body = await parseJsonResponse<ApiSuccess<ReviewApplication>>(response)
    setApplication(body.data)
    setApprovedAmount(Number(body.data.approved_amount ?? body.data.amount))
    setApprovedRate(Number(body.data.approved_rate ?? body.data.ai_suggested_rate ?? body.data.loan_product?.base_interest_rate ?? 0))
    setApprovedTenure(Number(body.data.approved_tenure_months ?? body.data.tenure_months))
    setLoading(false)
  }, [params.id])

  useEffect(() => {
    void loadApplication()
  }, [loadApplication])

  const emi = useMemo(
    () => calculateEMI(approvedAmount, approvedRate, approvedTenure),
    [approvedAmount, approvedRate, approvedTenure],
  )

  const takeAction = async (action: 'approve' | 'request_info' | 'reject') => {
    setWorking(true)

    const response = await fetch(`/api/applications/${params.id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        approved_amount: action === 'approve' ? approvedAmount : undefined,
        approved_rate: action === 'approve' ? approvedRate : undefined,
        approved_tenure_months: action === 'approve' ? approvedTenure : undefined,
        officer_notes: notes,
      }),
    })

    try {
      await parseJsonResponse(response)
      toast.success('Application updated successfully.')
      setNotes('')
      setModal(null)
      await loadApplication()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update application')
    } finally {
      setWorking(false)
    }
  }

  const toggleVerification = async (documentId: string, verified: boolean) => {
    const response = await fetch('/api/documents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: documentId, verified: !verified }),
    })

    try {
      await parseJsonResponse(response)
      toast.success('Document status updated.')
      await loadApplication()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update document')
    }
  }

  if (loading) {
    return <Skeleton className="h-[820px]" />
  }

  if (!application) {
    return <EmptyState icon={FileText} title="Application not found" description="The requested case could not be located." />
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-lg border border-[#E8ECF0] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="outline">
              <Link href="/officer/pipeline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Pipeline
              </Link>
            </Button>
            <StatusBadge status={application.status} />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-[#1A202C]">{application.loan_product?.name}</p>
              <p className="mt-1 text-sm text-[#718096]">
                Application ID {application.id.slice(0, 8)} • Submitted {formatDate(application.created_at)}
              </p>
            </div>
            {['approved', 'rejected', 'disbursed'].includes(application.status) ? null : (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setModal('approve')}>Approve</Button>
                <Button variant="outline" onClick={() => setModal('request_info')}>
                  Request Info
                </Button>
                <Button variant="danger" onClick={() => setModal('reject')}>
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Applicant Profile</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[#718096]">Full Name</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{application.borrower?.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#718096]">Email</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{application.borrower?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-[#718096]">Phone</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{application.borrower?.phone ?? 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#718096]">Member Since</p>
                  <p className="text-sm font-semibold text-[#1A202C]">
                    {application.borrower?.created_at ? formatDate(application.borrower.created_at) : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment & Finance</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[#718096]">Employment Status</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{application.employment_status.replaceAll('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-[#718096]">Annual Income</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{formatINR(application.annual_income)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#718096]">Employer / Business</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{application.employer_name ?? 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#718096]">Credit Score</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{application.self_reported_credit_score ?? 'Not provided'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-[#718096]">Existing Loans</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{application.existing_loans ?? 'None'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loan Request</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[#718096]">Product</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{application.loan_product?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#718096]">Requested Amount</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{formatINR(application.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#718096]">Tenure</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{application.tenure_months} months</p>
                </div>
                <div>
                  <p className="text-xs text-[#718096]">Purpose</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{application.purpose}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <AIDecisionCard application={application} />

            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {application.documents?.length ? (
                  application.documents.map((document) => {
                    const verified = Boolean(document.verified)

                    return (
                      <div key={String(document.id)} className="flex flex-col gap-3 rounded-lg border border-[#E8ECF0] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#1A202C]">{String(document.file_name)}</p>
                          <p className="mt-1 text-xs text-[#718096]">{String(document.doc_type).replaceAll('_', ' ')} • {formatDate(String(document.uploaded_at))}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={verified ? 'success' : 'warning'}>{verified ? 'Verified' : 'Pending verification'}</Badge>
                          <Button size="sm" variant="outline" onClick={() => void toggleVerification(String(document.id), verified)}>
                            {verified ? 'Unverify' : 'Verify'}
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <a href={String(document.file_url)} target="_blank" rel="noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <EmptyState icon={FileText} title="No documents uploaded" description="Borrower-uploaded documents will appear here for verification." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {application.audit_logs?.length ? (
                  application.audit_logs.map((log) => (
                    <div key={String(log.id)} className="rounded-lg border border-[#E8ECF0] p-4">
                      <p className="text-sm font-semibold text-[#1A202C]">{String(log.action).replaceAll('_', ' ')}</p>
                      <p className="mt-1 text-xs text-[#718096]">{formatDateTime(String(log.created_at))}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#718096]">No audit entries recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={modal === 'approve'} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent>
          <div className="space-y-4">
            <h2>Approve application</h2>
            <Input type="number" value={approvedAmount} onChange={(event) => setApprovedAmount(Number(event.target.value))} />
            <Input type="number" value={approvedRate} onChange={(event) => setApprovedRate(Number(event.target.value))} />
            <Input type="number" value={approvedTenure} onChange={(event) => setApprovedTenure(Number(event.target.value))} />
            <div className="rounded-md border border-[#E8ECF0] bg-[#F8FAFC] p-4">
              <p className="text-sm font-medium text-[#1A202C]">Calculated EMI</p>
              <p className="mt-1 text-sm text-[#4A5568]">{formatINR(emi.emi)}</p>
            </div>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Approval notes shown in the audit trail and borrower view" />
            <LoadingButton loading={working} onClick={() => void takeAction('approve')}>
              Confirm approval
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === 'request_info'} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent>
          <div className="space-y-4">
            <h2>Request additional information</h2>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Describe what documents or clarification are required" />
            <LoadingButton loading={working} variant="outline" onClick={() => void takeAction('request_info')}>
              Send request
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === 'reject'} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent>
          <div className="space-y-4">
            <h2>Reject application</h2>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Reason for rejection shown to the borrower" />
            <LoadingButton loading={working} variant="danger" onClick={() => void takeAction('reject')}>
              Confirm rejection
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
