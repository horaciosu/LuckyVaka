import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from './supabase'

/**
 * useAuth — hook de autenticacion para LuckyVaka
 *
 * Uso basico (solo requiere sesion):
 *   const { user, loading } = useAuth({ required: true })
 *
 * Uso con rol especifico:
 *   const { user, loading } = useAuth({ required: true, role: 'host' })
 *
 * Sin proteccion (solo leer usuario):
 *   const { user, loading } = useAuth()
 */
export function useAuth({ required = false, role = null, redirectTo = '/login' } = {}) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Obtener sesion actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)

      // 2. Si la ruta requiere autenticacion y no hay sesion → redirigir
      if (required && !u) {
        setTimeout(() => router.replace(redirectTo), 800)
        return
      }

      // 3. Si la ruta requiere un rol especifico y el usuario no lo tiene → redirigir
      if (required && role && u) {
        const userRole = u.user_metadata?.role
        if (userRole !== role) {
          // Host intentando entrar a dashboard de guest, o viceversa
          if (userRole === 'host') {
            router.replace('/host')
          } else {
            router.replace('/dashboard')
          }
        }
      }
    })

    // 4. Escuchar cambios de sesion (login/logout en otra pestaña)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)

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

  // Helpers
  const isHost = user?.user_metadata?.role === 'host'
  const isGuest = user?.user_metadata?.role === 'guest'
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return { user, loading, signOut, isHost, isGuest, displayName, initials }
}
