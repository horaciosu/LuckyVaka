import { useState } from 'react'
import Navbar from '../components/Navbar'
import RaffleCard from '../components/RaffleCard'
import { RAFFLES } from '../lib/data'

export default function RafflesPage({ lang, setLang }) {
  const [filter, setFilter] = useState('all')

  const filtered = RAFFLES.filter(r => {
    if (filter === 'all') return true
    if (filter === 'mx') return r.location.includes('MX')
    if (filter === 'us') return r.location.includes('USA')
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          {lang === 'es' ? 'Rifas activas' : 'Active raffles'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
          {lang === 'es' ? 'Elige tu próxima estancia — el sorteo es en vivo y el ganador siempre está garantizado.' : 'Choose your next stay — live draw, guaranteed winner every time.'}
        </p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            ['all', lang === 'es' ? 'Todos' : 'All'],
            ['mx', '🇲🇽 México'],
            ['us', '🇺🇸 USA'],
          ].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: '1px solid var(--border)',
              background: filter === val ? 'var(--brand)' : 'transparent',
              color: filter === val ? '#fff' : 'var(--muted)',
              fontWeight: filter === val ? 500 : 400,
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(r => <RaffleCard key={r.id} raffle={r} lang={lang} />)}
        </div>
      </div>
    </div>
  )
}
