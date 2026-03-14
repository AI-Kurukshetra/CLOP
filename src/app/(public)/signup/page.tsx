'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Briefcase, UserRound } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [role, setRole] = useState<'borrower' | 'officer'>('borrower')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const submit = async () => {
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (error || !data.user) {
      setError(error?.message ?? 'Unable to create account')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: form.full_name,
      email: form.email,
      role,
      phone: form.phone,
    })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    toast.success('Account created successfully.')
    router.push(role === 'officer' ? '/officer/dashboard' : '/borrower/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create your LendFlow account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              className={`rounded-2xl border p-5 text-left ${role === 'borrower' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
              onClick={() => setRole('borrower')}
              type="button"
            >
              <UserRound className="h-5 w-5 text-blue-600" />
              <p className="mt-4 text-base font-semibold text-slate-900">I want to apply for a loan</p>
              <p className="mt-1 text-sm text-slate-600">Submit applications, upload documents, and track progress.</p>
            </button>
            <button
              className={`rounded-2xl border p-5 text-left ${role === 'officer' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
              onClick={() => setRole('officer')}
              type="button"
            >
              <Briefcase className="h-5 w-5 text-blue-600" />
              <p className="mt-4 text-base font-semibold text-slate-900">I am a Loan Officer</p>
              <p className="mt-1 text-sm text-slate-600">Review AI decisions and manage the pipeline.</p>
            </button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Full Name</Label>
              <Input className="mt-2" value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-2" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-2" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <div>
              <Label>Password</Label>
              <Input className="mt-2" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label>Confirm Password</Label>
              <Input className="mt-2" type="password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
            </div>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <LoadingButton className="w-full" loading={loading} onClick={() => void submit()}>
            Create Account
          </LoadingButton>
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
