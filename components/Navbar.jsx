import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Navbar({ lang, setLang }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const initials = user?.user_metadata?.full_name
    ?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?'

  const role = user?.user_metadata?.role

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px', borderBottom: '1px solid var(--border)',
      background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, background: 'var(--brand)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
            <path d="M7 1l1.5 3.5L12 5.5l-2.5 2.5.6 3.5L7 9.8 3.9 11.5l.6-3.5L2 5.5l3.5-1L7 1z" fill="white"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>
          Lucky Vaka
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/raffles" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>
          {lang === 'en' ? 'Explore' : 'Explorar'}
        </Link>
        <Link href="/login" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>
          {lang === 'en' ? 'List property' : 'Anfitrión'}
        </Link>

        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {['en', 'es'].map(l => (
            <button key={l} onClick={() => setLang && setLang(l)} style={{
              padding: '4px 10px', fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer',
              background: lang === l ? 'var(--brand)' : 'transparent',
              color: lang === l ? '#fff' : 'var(--muted)',
            }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {user ? (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(m => !m)} style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--brand-light)', color: 'var(--brand-dark)',
              border: '2px solid var(--brand)', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {initials}
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 42, width: 180,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                overflow: 'hidden', zIndex: 200,
              }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                    {user.user_metadata?.full_name || user.email}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                    {role === 'host' ? (lang === 'es' ? 'Anfitrión' : 'Host') : (lang === 'es' ? 'Viajero' : 'Traveler')}
                  </div>
                </div>
                {[
                  role === 'host'
                    ? { href: '/host', label: lang === 'es' ? 'Panel anfitrión' : 'Host panel', icon: '🏡' }
                    : { href: '/dashboard', label: lang === 'es' ? 'Mis boletos' : 'My tickets', icon: '🎟' },
                  { href: '/dashboard', label: lang === 'es' ? 'Mi cuenta' : 'My account', icon: '👤' },
                ].map(item => (
                  <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 14px', fontSize: 13, color: 'var(--text)',
                    textDecoration: 'none', borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
                  </Link>
                ))}
                <button onClick={handleLogout} style={{
                  width: '100%', padding: '9px 14px', fontSize: 13,
                  color: '#E24B4A', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span>🚪</span> {lang === 'es' ? 'Cerrar sesión' : 'Log out'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/login" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }}>
              {lang === 'en' ? 'Log in' : 'Entrar'}
            </Link>
            <Link href="/signup" className="btn-primary" style={{ padding: '7px 14px', fontSize: 13 }}>
              {lang === 'en' ? 'Sign up' : 'Registrarse'}
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
