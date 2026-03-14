'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'

import { parseJsonResponse } from '@/lib/utils/api'
import type { ApiSuccess, LoanApplication } from '@/types'

export function useApplications(query = '') {
  const [applications, setApplications] = useState<LoanApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadApplications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/applications${query}`, { cache: 'no-store' })
      const body = await parseJsonResponse<ApiSuccess<LoanApplication[]>>(response)
      setApplications(body.data)
    } catch (fetchError) {
      setApplications([])
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load applications')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    startTransition(() => {
      void loadApplications()
    })
  }, [loadApplications])

  return {
    applications,
    loading: loading || isPending,
    error,
    refresh: loadApplications,
  }
}
