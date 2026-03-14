import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatINR } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import type { LoanApplication } from '@/types'
import { StatusBadge } from './StatusBadge'

export function ApplicationCard({ application, basePath }: { application: LoanApplication; basePath: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold text-slate-900">{application.loan_product?.name ?? 'Loan Application'}</p>
          <p className="mt-1 text-sm text-slate-600">
            {formatINR(application.amount)} • {application.tenure_months} months
          </p>
          <p className="mt-1 text-xs text-slate-500">Applied on {formatDate(application.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={application.status} />
          <Button asChild variant="outline">
            <Link href={`${basePath}/${application.id}`}>View</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
