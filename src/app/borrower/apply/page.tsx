'use client'

import { useEffect, useState } from 'react'

import { ApplicationForm } from '@/components/applications/ApplicationForm'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { parseJsonResponse } from '@/lib/utils/api'
import type { ApiSuccess, LoanProduct } from '@/types'
import { FileText } from 'lucide-react'

export default function BorrowerApplyPage() {
  const [products, setProducts] = useState<LoanProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      const response = await fetch('/api/loan-products', { cache: 'no-store' })
      const body = await parseJsonResponse<ApiSuccess<LoanProduct[]>>(response)
      setProducts(body.data)
      setLoading(false)
    }

    void loadProducts()
  }, [])

  if (loading) {
    return <Skeleton className="h-[640px]" />
  }

  if (!products.length) {
    return <EmptyState icon={FileText} title="No active loan products" description="Ask your loan operations team to activate products before accepting applications." />
  }

  return <ApplicationForm products={products} />
}
