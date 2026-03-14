'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { APP_NAME, landingFeatureCards } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const quickLogin = async (email: string, password: string) => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Login succeeded but session is unavailable. Please try again.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      toast.error(profileError.message)
      setLoading(false)
      return
    }

    if (!profile?.role) {
      await supabase.auth.signOut()
      toast.error('Profile not found for this account. Please run seed or create a profile.')
      setLoading(false)
      return
    }

    router.push(profile?.role === 'officer' ? '/officer/dashboard' : '/borrower/dashboard')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="page-shell">
      <header className="border-b border-[#E8ECF0] bg-white">
        <div className="page-container flex items-center justify-between py-4">
          <p className="text-lg font-semibold text-[#1A202C]">{APP_NAME}</p>
          <Button asChild variant="outline">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>
      <section className="border-b border-[#E8ECF0] bg-white">
        <div className="page-container">
          <div className="grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="max-w-3xl text-[34px] leading-[42px] text-[#1A202C] sm:text-[42px] sm:leading-[50px]">
                Get Your Loan Approved in Minutes, Not Days
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4A5568]">
                AI-powered lending platform that analyzes your financial profile instantly and gives a real-time credit decision.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/signup">
                    Apply for a Loan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login">Loan Officer Login</Link>
                </Button>
              </div>
            </div>
            <Card className="self-start">
              <CardHeader>
                <CardTitle>Try the Live Demo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Borrower Login</p>
                  <p className="mt-2 text-sm text-slate-600">borrower@demo.com / Demo@1234</p>
                  <Button className="mt-4 w-full" disabled={loading} onClick={() => void quickLogin('borrower@demo.com', 'Demo@1234')}>
                    Login as Borrower
                  </Button>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Officer Login</p>
                  <p className="mt-2 text-sm text-slate-600">officer@demo.com / Demo@1234</p>
                  <Button className="mt-4 w-full" variant="outline" disabled={loading} onClick={() => void quickLogin('officer@demo.com', 'Demo@1234')}>
                    Login as Officer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="page-container py-8">
        <div className="mb-8 text-center">
          <h2>How It Works</h2>
          <p className="mt-2 text-sm text-slate-600">A streamlined lending flow designed for speed, clarity, and compliance.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: landingFeatureCards[0].icon, title: 'Apply Online', text: 'Borrowers complete a simple digital application in minutes.' },
            { icon: landingFeatureCards[1].icon, title: 'Instant Credit Rules', text: 'The rules engine evaluates affordability and policy fit instantly.' },
            { icon: landingFeatureCards[2].icon, title: 'Officer Review', text: 'Loan officers manage cases, documents, and decisions in one place.' },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="p-6">
                <div className="mb-4 inline-flex rounded-md bg-[#EAF2FF] p-3">
                  <item.icon className="h-5 w-5 text-[#1D5FA6]" />
                </div>
                <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#E8ECF0] bg-white">
        <div className="page-container flex flex-col gap-2 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-semibold text-[#1A202C]">{APP_NAME}</p>
          <p className="text-sm text-[#718096]">Modern lending. Instant decisions.</p>
        </div>
      </footer>
    </div>
  )
}
