import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import RaffleCard from '../components/RaffleCard'
import { supabase } from '../lib/supabase'

export default function RafflesPage({ lang, setLang }) {
  const [filter, setFilter] = useState('all')
  const [raffles, setRaffles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRaffles()
  }, [])

  const loadRaffles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('raffles')
      .select('*, properties(name, city, country, images, emoji)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (data) {
      // Map Supabase data to the format RaffleCard expects
      const mapped = data.map(r => ({
        id: r.id,
        slug: r.slug,
        title: r.properties?.name || 'Property',
        location: `${r.properties?.city || ''}, ${r.properties?.country || ''}`,
        emoji: r.properties?.emoji || '🏡',
        images: r.properties?.images || [],
        ticketPrice: r.ticket_price,
        currency: r.currency,
        totalTickets: r.total_tickets,
        ticketsSold: r.tickets_sold || 0,
        drawDate: r.draw_date,
        stayDate: r.stay_date,
        prize: (r.ticket_price * r.total_tickets * 0.77).toFixed(0),
      }))
      setRaffles(mapped)
    }
    setLoading(false)
  }

  const filtered = raffles.filter(r => {
    if (filter === 'all') return true
    if (filter === 'mx') return r.location.includes('MX') || r.location.includes('México') || r.location.includes('Mexico')
    if (filter === 'us') return r.location.includes('USA') || r.location.includes('United States')
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontSize: 13 }}>
            ⏳ {lang === 'es' ? 'Cargando rifas...' : 'Loading raffles...'}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎟</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
              {lang === 'es' ? 'No hay rifas activas aún' : 'No active raffles yet'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {lang === 'es' ? 'Vuelve pronto — pronto habrá propiedades disponibles.' : 'Check back soon — properties coming soon.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {filtered.map(r => <RaffleCard key={r.id} raffle={r} lang={lang} />)}
          </div>
        )}
      </div>
    </div>
  )
}

