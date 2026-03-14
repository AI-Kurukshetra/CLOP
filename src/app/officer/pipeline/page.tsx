'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { ApplicationTable } from '@/components/applications/ApplicationTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useApplications } from '@/hooks/useApplications'

const statusOptions = ['pending', 'under_review', 'additional_info_required', 'approved', 'rejected', 'disbursed', 'cancelled']

export default function OfficerPipelinePage() {
  const { applications, loading } = useApplications()
  const [search, setSearch] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [loanType, setLoanType] = useState('all')
  const [aiDecision, setAiDecision] = useState('all')

  const filtered = useMemo(() => {
    return applications.filter((application) => {
      const matchesSearch = application.borrower?.full_name?.toLowerCase().includes(search.toLowerCase()) ?? true
      const matchesStatus = !selectedStatuses.length || selectedStatuses.includes(application.status)
      const matchesLoanType = loanType === 'all' || application.loan_product?.type === loanType
      const matchesAi = aiDecision === 'all' || application.ai_decision === aiDecision
      return matchesSearch && matchesStatus && matchesLoanType && matchesAi
    })
  }, [aiDecision, applications, loanType, search, selectedStatuses])

  if (loading) {
    return <Skeleton className="h-[760px]" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Bar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Status</p>
            <div className="mt-3 space-y-2">
              {statusOptions.map((status) => (
                <label key={status} className="flex items-center gap-2 text-sm text-slate-600">
                  <Checkbox
                    checked={selectedStatuses.includes(status)}
                    onChange={(event) =>
                      setSelectedStatuses((current) =>
                        event.target.checked ? [...current, status] : current.filter((item) => item !== status),
                      )
                    }
                  />
                  {status.replaceAll('_', ' ')}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">Loan Type</p>
              <Select value={loanType} onValueChange={setLoanType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">AI Decision</p>
              <Select value={aiDecision} onValueChange={setAiDecision}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="manual_review">Manual Review</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4 lg:col-span-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">Search by Applicant Name</p>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Applications Table</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length ? (
            <ApplicationTable applications={filtered.slice(0, 20)} basePath="/officer/applications" showApplicant />
          ) : (
            <EmptyState icon={Search} title="No matching applications" description="Adjust the filters to broaden the pipeline view." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
