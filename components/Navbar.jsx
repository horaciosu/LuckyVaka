import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Navbar({ lang, setLang }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hostStatus, setHostStatus] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user || null
      setUser(u)
      if (u) loadProfile(u.id)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user || null
      setUser(u)
      if (u) loadProfile(u.id)
      else setProfile(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url, full_name, phone')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  const { data: app } = await supabase
    .from('host_applications')
    .select('status')
    .eq('user_id', userId)
    .single()
  setHostStatus(app?.status || null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const initials = displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?'
  const avatarUrl = profile?.avatar_url || null

  const ADMIN_EMAIL = 'horaciosoriau@gmail.com'
  const isAdmin = user?.email === ADMIN_EMAIL
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
      {user && <Link href={role === 'host' ? '/host' : hostStatus === 'pending' ? '/host-pending' : '/host-register'} style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>{lang === 'en' ? 'List property' : 'Anfitrión'}</Link>}

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
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid var(--brand)',
              cursor: 'pointer', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: avatarUrl ? 'transparent' : 'var(--brand-light)',
              padding: 0,
            }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                />
              ) : null}
              <span style={{
                fontSize: 12, fontWeight: 600, color: 'var(--brand-dark)',
                display: avatarUrl ? 'none' : 'flex',
                alignItems: 'center', justifyContent: 'center',
                width: '100%', height: '100%',
              }}>
                {initials}
              </span>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 44, width: 200,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                overflow: 'hidden', zIndex: 200,
              }}>
                {/* Header del menú con avatar */}
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--brand)', background: 'var(--brand-light)' }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--brand-dark)' }}>
                        {initials}
                      </div>
                    )}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                      {role === 'host' ? (lang === 'es' ? 'Anfitrión' : 'Host') : (lang === 'es' ? 'Viajero' : 'Traveler')}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 14px', fontSize: 13, color: '#A32D2D',
                    textDecoration: 'none', borderBottom: '1px solid var(--border)',
                    background: '#FCEBEB',
                  }}>
                    <span>🔐</span> Admin panel
                  </Link>
                )}

            {[
              { href: '/host', label: lang === 'es' ? 'Panel anfitrión' : 'Host panel', icon: '🏠' },
              { href: '/dashboard?tab=tickets', label: lang === 'es' ? 'Mis boletos' : 'My tickets', icon: '🎟️' },
              role === 'host'
                ? { href: '/my-properties', label: lang === 'es' ? 'Mis propiedades' : 'My properties', icon: '🏡' }
                : { href: '/dashboard', label: lang === 'es' ? 'Mi cuenta' : 'My account', icon: '👤' },
              { href: '/profile', label: lang === 'es' ? 'Editar perfil' : 'Edit profile', icon: '✏️' },
            ].map(item => (
                  <Link key={item.href + item.label} href={item.href} onClick={() => setMenuOpen(false)} style={{
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
