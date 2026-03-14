'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, FileText, UploadCloud } from 'lucide-react'

import { AIDecisionCard } from '@/components/applications/AIDecisionCard'
import { StatusBadge } from '@/components/applications/StatusBadge'
import { StatusTimeline } from '@/components/applications/StatusTimeline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { calculateEMI } from '@/lib/utils/calculateEMI'
import { formatINR } from '@/lib/utils/formatCurrency'
import { formatDate, formatDateTime } from '@/lib/utils/formatDate'
import { parseJsonResponse } from '@/lib/utils/api'
import type { ApiSuccess, LoanApplication } from '@/types'

export default function BorrowerApplicationDetailPage({ params }: { params: { id: string } }) {
  const [application, setApplication] = useState<(LoanApplication & { documents?: Array<Record<string, unknown>> }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadApplication() {
      const response = await fetch(`/api/applications/${params.id}`, { cache: 'no-store' })
      const body = await parseJsonResponse<ApiSuccess<LoanApplication>>(response)
      setApplication(body.data as LoanApplication & { documents?: Array<Record<string, unknown>> })
      setLoading(false)
    }

    void loadApplication()
  }, [params.id])

  const approvedEmi = useMemo(() => {
    if (!application?.approved_amount || !application.approved_rate || !application.approved_tenure_months) {
      return null
    }

    return calculateEMI(application.approved_amount, application.approved_rate, application.approved_tenure_months)
  }, [application?.approved_amount, application?.approved_rate, application?.approved_tenure_months])

  if (loading) {
    return <Skeleton className="h-[720px]" />
  }

  if (!application) {
    return <EmptyState icon={FileText} title="Application not found" description="The requested application could not be located." />
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>{application.loan_product?.name}</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  {formatINR(application.amount)} • Applied on {formatDate(application.created_at)}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline application={application} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Product</p>
              <p className="text-sm font-semibold text-slate-900">{application.loan_product?.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Amount</p>
              <p className="text-sm font-semibold text-slate-900">{formatINR(application.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tenure</p>
              <p className="text-sm font-semibold text-slate-900">{application.tenure_months} months</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Purpose</p>
              <p className="text-sm font-semibold text-slate-900">{application.purpose}</p>
            </div>
          </CardContent>
        </Card>

        {application.status === 'additional_info_required' ? (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle>Action Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-900">{application.officer_notes}</p>
              <Button className="mt-4" variant="outline">
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload additional document
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="space-y-6">
        <AIDecisionCard application={application} />

        {application.status === 'approved' && application.approved_amount ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle>Approved Terms</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-green-700">Approved Amount</p>
                <p className="text-lg font-semibold text-green-900">{formatINR(application.approved_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-green-700">Interest Rate</p>
                <p className="text-lg font-semibold text-green-900">{application.approved_rate}%</p>
              </div>
              <div>
                <p className="text-xs text-green-700">Tenure</p>
                <p className="text-lg font-semibold text-green-900">{application.approved_tenure_months} months</p>
              </div>
              <div>
                <p className="text-xs text-green-700">Monthly EMI</p>
                <p className="text-lg font-semibold text-green-900">{formatINR(approvedEmi?.emi ?? 0)}</p>
              </div>
              <Button className="sm:col-span-2">Accept Offer</Button>
            </CardContent>
          </Card>
        ) : null}

        {application.reviewed_at ? (
          <Card>
            <CardHeader>
              <CardTitle>Officer Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-600">Officer ID: {application.officer_id}</p>
              <p className="text-sm text-slate-600">Decision Date: {application.decision_at ? formatDateTime(application.decision_at) : 'Pending'}</p>
              <p className="text-sm text-slate-600">{application.officer_notes}</p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {application.documents?.length ? (
              application.documents.map((document) => (
                <div key={String(document.id)} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{String(document.file_name)}</p>
                    <p className="text-xs text-slate-500">{formatDate(String(document.uploaded_at))}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={Boolean(document.verified) ? 'success' : 'default'}>
                      {Boolean(document.verified) ? 'Verified' : 'Pending'}
                    </Badge>
                    <Button asChild variant="outline" size="sm">
                      <a href={String(document.file_url)} target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon={FileText} title="No documents found" description="Uploaded documents will appear here." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
