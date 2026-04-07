import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from './supabase'

export function useAuth({ required = false, redirectTo = '/login' } = {}) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState(null)

  const fetchProfile = async (u) => {
    if (!u) { setAvatarUrl(null); return }
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', u.id)
      .single()
    setAvatarUrl(data?.avatar_url || null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)
      fetchProfile(u)
      if (required && !u) {
        setTimeout(() => router.replace(redirectTo), 800)
        return
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      fetchProfile(u)
      if (required && !u) {
        setTimeout(() => router.replace(redirectTo), 800)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isHost = user?.user_metadata?.role === 'host'
  const isGuest = user?.user_metadata?.role === 'guest'
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return { user, loading, signOut, isHost, isGuest, displayName, initials, avatarUrl }
}
