import { useState } from 'react'
import Link from 'next/link'

export default function Navbar({ lang, setLang }) {
  const [menu, setMenu] = useState(false)

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 24px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28,
          background: 'var(--brand)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
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
        <Link href="/host" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>
          {lang === 'en' ? 'List property' : 'Anfitrión'}
        </Link>

        {/* Language toggle */}
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {['en', 'es'].map(l => (
            <button
              key={l}
              onClick={() => setLang && setLang(l)}
              style={{
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: lang === l ? 'var(--brand)' : 'transparent',
                color: lang === l ? '#fff' : 'var(--muted)',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <Link href="/login" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }}>
          {lang === 'en' ? 'Log in' : 'Entrar'}
        </Link>
        <Link href="/signup" className="btn-primary" style={{ padding: '7px 14px', fontSize: 13 }}>
          {lang === 'en' ? 'Sign up' : 'Registrarse'}
        </Link>
      </div>
    </nav>
  )
}
