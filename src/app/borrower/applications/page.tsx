'use client'

import { FileText } from 'lucide-react'

import { ApplicationCard } from '@/components/applications/ApplicationCard'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useApplications } from '@/hooks/useApplications'

export default function BorrowerApplicationsPage() {
  const { applications, loading } = useApplications()

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    )
  }

  if (!applications.length) {
    return <EmptyState icon={FileText} title="No applications yet" description="Start your first application to track it here." />
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} basePath="/borrower/applications" />
      ))}
    </div>
  )
}
