'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface Profile {
  id: string
  role: 'admin' | 'worker'
  name: string | null
  owner_id: string | null
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setProfile(data as Profile)
        setLoading(false)
      })
  }, [userId])

  return { profile, loading }
}
