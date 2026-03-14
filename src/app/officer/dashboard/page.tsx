'use client'

import { useMemo } from 'react'
import { CheckCircle2, Clock3, Percent, ReceiptIndianRupee, XCircle } from 'lucide-react'
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'

import { ApplicationTable } from '@/components/applications/ApplicationTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { useApplications } from '@/hooks/useApplications'
import { formatDate } from '@/lib/utils/formatDate'
import { formatINR } from '@/lib/utils/formatCurrency'

export default function OfficerDashboardPage() {
  const { applications, loading } = useApplications()

  const metrics = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const approvedThisMonth = applications.filter((application) => application.status === 'approved' && new Date(application.created_at).getMonth() === currentMonth).length
    const rejectedThisMonth = applications.filter((application) => application.status === 'rejected' && new Date(application.created_at).getMonth() === currentMonth).length
    const pendingAction = applications.filter((application) => ['pending', 'under_review'].includes(application.status)).length
    const decided = applications.filter((application) => ['approved', 'rejected'].includes(application.status))

    return {
      totalApplications: applications.length,
      pendingAction,
      approvedThisMonth,
      rejectedThisMonth,
      approvalRate: decided.length ? Math.round((applications.filter((application) => application.status === 'approved').length / decided.length) * 100) : 0,
    }
  }, [applications])

  const dailyVolume = useMemo(() => {
    const map = new Map<string, { received: number; decided: number }>()

    applications.forEach((application) => {
      const key = formatDate(application.created_at)
      map.set(key, {
        received: (map.get(key)?.received ?? 0) + 1,
        decided: map.get(key)?.decided ?? 0,
      })

      if (application.decision_at) {
        const decisionKey = formatDate(application.decision_at)
        map.set(decisionKey, {
          received: map.get(decisionKey)?.received ?? 0,
          decided: (map.get(decisionKey)?.decided ?? 0) + 1,
        })
      }
    })

    return Array.from(map.entries()).slice(-14).map(([date, value]) => ({ date, ...value }))
  }, [applications])

  const statusData = useMemo(() => {
    const counts = applications.reduce<Record<string, number>>((acc, application) => {
      acc[application.status] = (acc[application.status] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [applications])

  const requiringAction = applications.filter((application) => ['pending', 'under_review'].includes(application.status))

  if (loading) {
    return <Skeleton className="h-[720px]" />
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatsCard title="Total Applications" value={String(metrics.totalApplications)} subtitle="All-time intake volume" icon={ReceiptIndianRupee} />
        <StatsCard title="Pending Action" value={String(metrics.pendingAction)} subtitle="Requires officer attention" icon={Clock3} />
        <StatsCard title="Approved This Month" value={String(metrics.approvedThisMonth)} subtitle="Positive decisions this month" icon={CheckCircle2} />
        <StatsCard title="Rejected This Month" value={String(metrics.rejectedThisMonth)} subtitle="Rejections this month" icon={XCircle} />
        <StatsCard title="Approval Rate" value={`${metrics.approvalRate}%`} subtitle="Approved / decided" icon={Percent} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Application Volume Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyVolume}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="received" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="decided" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={100}>
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={['#facc15', '#2563eb', '#22c55e', '#ef4444', '#8b5cf6'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications Requiring Action</CardTitle>
        </CardHeader>
        <CardContent>
          {requiringAction.length ? (
            <ApplicationTable applications={requiringAction} basePath="/officer/applications" showApplicant />
          ) : (
            <EmptyState icon={CheckCircle2} title="No queued applications" description="There are no pending or under-review applications right now." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Decisions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {applications.filter((application) => ['approved', 'rejected'].includes(application.status)).slice(0, 5).map((application) => (
            <div key={application.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{application.borrower?.full_name ?? 'Applicant'}</p>
                <p className="text-sm text-slate-600">{formatINR(application.amount)} • {application.status}</p>
              </div>
              <p className="text-xs text-slate-500">{application.decision_at ? formatDate(application.decision_at) : formatDate(application.created_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
