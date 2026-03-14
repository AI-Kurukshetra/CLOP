import { CheckCircle2, Circle } from 'lucide-react'

import { cn } from '@/lib/utils/cn'
import type { LoanApplication } from '@/types'

export function StatusTimeline({ application }: { application: LoanApplication }) {
  const steps = [
    { label: 'Application Submitted', done: true },
    { label: 'AI Analysis Complete', done: Boolean(application.ai_decision) },
    {
      label: 'Officer Review',
      done: ['approved', 'rejected', 'additional_info_required', 'disbursed'].includes(application.status),
      active: application.status === 'under_review',
    },
    {
      label: 'Final Decision',
      done: ['approved', 'rejected', 'disbursed'].includes(application.status),
    },
    {
      label: 'Disbursement',
      done: application.status === 'disbursed',
      active: application.status === 'approved',
    },
  ]

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.label} className="flex gap-4">
          <div className="flex flex-col items-center">
            {step.done ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className={cn('h-5 w-5 text-slate-300', step.active && 'text-blue-600')} />
            )}
            {index < steps.length - 1 ? <span className="mt-1 h-8 w-px bg-slate-200" /> : null}
          </div>
          <div className="pt-0.5">
            <p className={cn('text-sm font-medium text-slate-500', (step.done || step.active) && 'text-slate-900')}>
              {step.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
