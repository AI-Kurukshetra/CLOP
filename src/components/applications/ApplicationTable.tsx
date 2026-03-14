import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatINR } from '@/lib/utils/formatCurrency'
import { formatDate, timeAgo } from '@/lib/utils/formatDate'
import type { LoanApplication } from '@/types'
import { StatusBadge } from './StatusBadge'

export function ApplicationTable({
  applications,
  basePath,
  showApplicant = false,
}: {
  applications: LoanApplication[]
  basePath: string
  showApplicant?: boolean
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showApplicant ? <TableHead>Applicant</TableHead> : null}
          <TableHead>Loan Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Tenure</TableHead>
          <TableHead>AI Decision</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
          {showApplicant ? <TableHead>Waiting</TableHead> : null}
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((application) => (
          <TableRow
            key={application.id}
            className={
              application.ai_decision === 'approve'
                ? 'bg-green-50/60'
                : application.ai_decision === 'reject'
                  ? 'bg-red-50/60'
                  : ''
            }
          >
            {showApplicant ? <TableCell>{application.borrower?.full_name ?? 'Applicant'}</TableCell> : null}
            <TableCell>{application.loan_product?.name ?? 'Loan'}</TableCell>
            <TableCell>{formatINR(application.amount)}</TableCell>
            <TableCell>{application.tenure_months} months</TableCell>
            <TableCell>
              {application.ai_decision ? (
                <Badge variant={application.ai_decision === 'approve' ? 'success' : application.ai_decision === 'reject' ? 'danger' : 'warning'}>
                  {application.ai_decision.replaceAll('_', ' ')}
                </Badge>
              ) : (
                <span className="text-slate-400">Pending</span>
              )}
            </TableCell>
            <TableCell>
              <StatusBadge status={application.status} />
            </TableCell>
            <TableCell>{formatDate(application.created_at)}</TableCell>
            {showApplicant ? <TableCell>{timeAgo(application.created_at)}</TableCell> : null}
            <TableCell>
              <Button asChild variant="outline" size="sm">
                <Link href={`${basePath}/${application.id}`}>View</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
