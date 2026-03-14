'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useApplications } from '@/hooks/useApplications'
import { formatDate } from '@/lib/utils/formatDate'

export default function OfficerAnalyticsPage() {
  const [range, setRange] = useState('30')
  const { applications, loading } = useApplications()

  const filtered = useMemo(() => {
    if (range === 'all') {
      return applications
    }

    const days = Number(range)
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return applications.filter((application) => new Date(application.created_at).getTime() >= cutoff)
  }, [applications, range])

  const volumeData = useMemo(() => {
    const map = new Map<string, { received: number; decided: number }>()
    filtered.forEach((application) => {
      const date = formatDate(application.created_at)
      map.set(date, { received: (map.get(date)?.received ?? 0) + 1, decided: map.get(date)?.decided ?? 0 })
      if (application.decision_at) {
        const decisionDate = formatDate(application.decision_at)
        map.set(decisionDate, { received: map.get(decisionDate)?.received ?? 0, decided: (map.get(decisionDate)?.decided ?? 0) + 1 })
      }
    })
    return Array.from(map.entries()).map(([date, metrics]) => ({ date, ...metrics }))
  }, [filtered])

  const statusData = useMemo(() => {
    const counts = filtered.reduce<Record<string, number>>((acc, application) => {
      acc[application.status] = (acc[application.status] ?? 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filtered])

  const byLoanType = useMemo(() => {
    const counts = filtered.reduce<Record<string, { total: number; approved: number; amount: number }>>((acc, application) => {
      const name = application.loan_product?.type ?? 'unknown'
      acc[name] = {
        total: (acc[name]?.total ?? 0) + 1,
        approved: (acc[name]?.approved ?? 0) + (application.status === 'approved' ? 1 : 0),
        amount: (acc[name]?.amount ?? 0) + Number(application.amount),
      }
      return acc
    }, {})
    return Object.entries(counts).map(([name, value]) => ({
      name,
      total: value.total,
      approved: value.approved,
      average: value.total ? Math.round(value.amount / value.total) : 0,
    }))
  }, [filtered])

  if (loading) {
    return <Skeleton className="h-[760px]" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>Analytics</h2>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Applications by Status</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={110}>
                  {statusData.map((entry, index) => <Cell key={entry.name} fill={['#FEF6E4', '#EAF2FF', '#E8F5EE', '#FDEEEE', '#F0EBFF'][index % 5]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Applications Over Last 14 Days</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line dataKey="received" stroke="#4F7EF7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Applications by Loan Type</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byLoanType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#4F7EF7" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
