import { CheckCircle2, Clock3, ShieldAlert, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatINR } from '@/lib/utils/formatCurrency'
import type { LoanApplication } from '@/types'

const decisionMap = {
  approve: { icon: CheckCircle2, variant: 'success' as const, label: 'Approve' },
  manual_review: { icon: Clock3, variant: 'warning' as const, label: 'Manual Review' },
  reject: { icon: XCircle, variant: 'danger' as const, label: 'Reject' },
}

const riskVariantMap = {
  low: 'success' as const,
  medium: 'warning' as const,
  high: 'orange' as const,
  very_high: 'danger' as const,
}

export function AIDecisionCard({ application }: { application: LoanApplication }) {
  if (!application.ai_decision) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-slate-500">
          AI analysis has not been completed yet.
        </CardContent>
      </Card>
    )
  }

  const decision = decisionMap[application.ai_decision]
  const Icon = decision.icon

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>AI Decision</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Automated recommendation with reasoning and risk assessment.</p>
          </div>
          <Badge variant={decision.variant} className="gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            {decision.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Confidence</span>
            <span className="font-semibold text-slate-900">{application.ai_confidence ?? 0}%</span>
          </div>
          <Progress value={application.ai_confidence ?? 0} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={riskVariantMap[application.ai_risk_level ?? 'medium']}>
            Risk: {(application.ai_risk_level ?? 'medium').replaceAll('_', ' ')}
          </Badge>
          {application.ai_suggested_rate ? <Badge variant="review">Suggested Rate: {application.ai_suggested_rate}%</Badge> : null}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Reasoning</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{application.ai_reasoning}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Key Factors
            </p>
            <ul className="space-y-2">
              {(application.ai_key_factors ?? []).map((factor) => (
                <li key={factor} className="text-sm text-slate-600">
                  {factor}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Red Flags
            </p>
            {application.ai_red_flags?.length ? (
              <ul className="space-y-2">
                {application.ai_red_flags.map((flag) => (
                  <li key={flag} className="text-sm text-slate-600">
                    {flag}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No critical red flags identified.</p>
            )}
          </div>
        </div>
        {application.approved_amount ? (
          <div className="rounded-2xl bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">Approved Terms</p>
            <p className="mt-2 text-lg font-semibold text-green-900">{formatINR(application.approved_amount)}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
