'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatINR } from '@/lib/utils/formatCurrency'
import { parseJsonResponse } from '@/lib/utils/api'
import type { LoanProduct } from '@/types'

export default function OfficerLoanProductsPage() {
  const [products, setProducts] = useState<LoanProduct[]>([])
  const [editing, setEditing] = useState<LoanProduct | null>(null)

  const loadProducts = async () => {
    const response = await fetch('/api/loan-products?all=1', { cache: 'no-store' })
    const body = await parseJsonResponse<{ data: LoanProduct[] }>(response)
    setProducts(body.data ?? [])
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const updateProduct = async (updates: Partial<LoanProduct>) => {
    if (!editing) return

    const response = await fetch('/api/loan-products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, id: editing.id }),
    })
    try {
      await parseJsonResponse(response)
      toast.success('Product updated successfully.')
      setEditing(null)
      await loadProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update product')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Product Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Min Amount</TableHead>
              <TableHead>Max Amount</TableHead>
              <TableHead>Tenure Range</TableHead>
              <TableHead>Base Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.type}</TableCell>
                <TableCell>{formatINR(product.min_amount)}</TableCell>
                <TableCell>{formatINR(product.max_amount)}</TableCell>
                <TableCell>{product.min_tenure_months}-{product.max_tenure_months} months</TableCell>
                <TableCell>{product.base_interest_rate}%</TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? 'success' : 'default'}>{product.is_active ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => void updateProduct({ id: product.id, is_active: !product.is_active })}>
                      Toggle
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setEditing(product)}>Edit</Button>
                      </DialogTrigger>
                      <DialogContent>
                        {editing ? (
                          <div className="space-y-4">
                            <h2>Edit Product</h2>
                            <Input defaultValue={editing.base_interest_rate} type="number" onChange={(event) => setEditing({ ...editing, base_interest_rate: Number(event.target.value) })} />
                            <Input defaultValue={editing.min_amount} type="number" onChange={(event) => setEditing({ ...editing, min_amount: Number(event.target.value) })} />
                            <Input defaultValue={editing.max_amount} type="number" onChange={(event) => setEditing({ ...editing, max_amount: Number(event.target.value) })} />
                            <Button onClick={() => void updateProduct(editing)}>Save Changes</Button>
                          </div>
                        ) : null}
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
