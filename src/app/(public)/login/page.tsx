'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [missingProfile, setMissingProfile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setMissingProfile(params.get('missing_profile') === '1')
  }, [])

  const submit = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
        toast.error(error.message)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        const message = 'Login succeeded but session is unavailable. Please try again.'
        setError(message)
        toast.error(message)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        setError(profileError.message)
        toast.error(profileError.message)
        return
      }

      if (!profile?.role) {
        await supabase.auth.signOut()
        const message = 'Profile not found for this account. Please run seed or create a profile.'
        setError(message)
        toast.error(message)
        return
      }

      router.push(profile.role === 'officer' ? '/officer/dashboard' : '/borrower/dashboard')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to LendFlow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={() => { setEmail('borrower@demo.com'); setPassword('Demo@1234') }}>
              Try as Borrower
            </Button>
            <Button variant="outline" onClick={() => { setEmail('officer@demo.com'); setPassword('Demo@1234') }}>
              Try as Officer
            </Button>
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {missingProfile && !error ? (
            <p className="text-sm text-amber-700">
              Signed-in user profile is missing or inaccessible. Apply the SQL fix in
              {' '}
              <code>scripts/fix_profiles_rls.sql</code>
              {' '}
              and try again.
            </p>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <LoadingButton className="w-full" loading={loading} onClick={() => void submit()}>
            Login
          </LoadingButton>
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-blue-600">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
