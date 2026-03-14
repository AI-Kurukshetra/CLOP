'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export function useUser() {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      setError(null)
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          setUser(null)
          return
        }

        const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()

        setUser(data)
      } catch (fetchError) {
        setUser(null)
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load user profile')
      } finally {
        setLoading(false)
      }
    }

    void loadUser()
  }, [])

  return { user, loading, error }
}
