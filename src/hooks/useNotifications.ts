'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { parseJsonResponse } from '@/lib/utils/api'
import type { ApiSuccess, Notification } from '@/types'

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadNotifications() {
      setError(null)
      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' })
        const body = await parseJsonResponse<ApiSuccess<Notification[]>>(response)
        setNotifications(body.data)
      } catch (fetchError) {
        setNotifications([])
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load notifications')
      } finally {
        setLoading(false)
      }
    }

    void loadNotifications()
  }, [])

  useEffect(() => {
    if (!userId) {
      return
    }

    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          try {
            const response = await fetch('/api/notifications', { cache: 'no-store' })
            const body = await parseJsonResponse<ApiSuccess<Notification[]>>(response)
            setNotifications(body.data)
            setError(null)
          } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : 'Unable to refresh notifications')
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  return {
    notifications,
    loading,
    error,
    unreadCount: notifications.filter((notification) => !notification.read).length,
  }
}
