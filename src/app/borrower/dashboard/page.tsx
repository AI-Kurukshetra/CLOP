'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock3, IndianRupee, LayoutGrid, PlusCircle } from 'lucide-react'

import { ApplicationTable } from '@/components/applications/ApplicationTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { PipelineChart } from '@/components/dashboard/PipelineChart'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { useApplications } from '@/hooks/useApplications'
import { useNotifications } from '@/hooks/useNotifications'
import { useUser } from '@/hooks/useUser'
import { formatINR } from '@/lib/utils/formatCurrency'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { Button } from '@/components/ui/button'

export default function BorrowerDashboardPage() {
  const { applications, loading } = useApplications()
  const { user } = useUser()
  const { notifications } = useNotifications(user?.id)

  const metrics = useMemo(() => {
    const approved = applications.filter((item) => item.status === 'approved')
    const pendingReview = applications.filter((item) => ['pending', 'under_review'].includes(item.status))

    return {
      totalApplications: applications.length,
      approved: approved.length,
      pendingReview: pendingReview.length,
      totalApprovedAmount: approved.reduce((sum, item) => sum + Number(item.approved_amount ?? 0), 0),
    }
  }, [applications])

  const chartData = useMemo(() => {
    const counts = applications.reduce<Record<string, number>>((acc, application) => {
      acc[application.status] = (acc[application.status] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(counts).map(([name, value]) => ({ name: name.replaceAll('_', ' '), value }))
  }, [applications])

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard title="Total Applications" value={String(metrics.totalApplications)} subtitle="All submitted loan requests" icon={LayoutGrid} />
          <StatsCard title="Approved" value={String(metrics.approved)} subtitle="Applications approved" icon={CheckCircle2} />
          <StatsCard title="Pending Review" value={String(metrics.pendingReview)} subtitle="Awaiting review or decision" icon={Clock3} />
          <StatsCard title="Total Approved Amount" value={formatINR(metrics.totalApprovedAmount)} subtitle="Approved value across loans" icon={IndianRupee} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Application Status Chart</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length ? (
              <>
                <PipelineChart data={chartData} />
                <div className="mt-4 flex flex-wrap gap-3">
                  {chartData.map((item) => (
                    <span key={item.name} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {item.name}: {item.value}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState icon={LayoutGrid} title="No applications yet" description="Apply for your first loan to see the portfolio breakdown." />
            )}
          </CardContent>
        </Card>
        <RecentActivity items={notifications.slice(0, 5)} />
      </div>

      <Card className="bg-blue-600 text-white">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-semibold">Ready to apply?</p>
            <p className="mt-1 text-sm text-blue-100">Start a new application and receive an AI-backed decision in minutes.</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/borrower/apply">
              <PlusCircle className="mr-2 h-4 w-4" />
              Apply Now
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length ? (
            <ApplicationTable applications={applications.slice(0, 5)} basePath="/borrower/applications" />
          ) : (
            <EmptyState icon={LayoutGrid} title="No applications yet" description="No applications yet. Apply for your first loan!" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
