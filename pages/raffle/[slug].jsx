import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import { RAFFLES, PAST_WINNERS } from '../../lib/data'

export default function RafflePage({ lang, setLang }) {
  const router = useRouter()
  const { slug } = router.query
  const raffle = RAFFLES.find(r => r.slug === slug) || RAFFLES[0]

  const [qty, setQty] = useState(1)
  const [selected, setSelected] = useState(new Set())
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 })

  // Generate taken tickets deterministically
  const taken = new Set()
  for (let i = 1; i <= raffle.tickets_sold; i++) {
    taken.add((i * 7 + 13) % raffle.total_tickets + 1)
  }

  // Countdown
  useEffect(() => {
    const target = new Date(raffle.draw_date + 'T20:00:00')
    const tick = () => {
      const diff = target - new Date()
      if (diff <= 0) return
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [raffle.draw_date])

  const toggleNum = (n) => {
    if (taken.has(n)) return
    const next = new Set(selected)
    if (next.has(n)) {
      next.delete(n)
    } else {
      if (next.size >= qty) {
        const first = [...next][0]
        next.delete(first)
      }
      next.add(n)
    }
    setSelected(next)
  }

  const pickRandom = () => {
    const avail = []
    for (let i = 1; i <= raffle.total_tickets; i++) {
      if (!taken.has(i)) avail.push(i)
    }
    avail.sort(() => Math.random() - 0.5)
    setSelected(new Set(avail.slice(0, qty)))
  }

  const pct = Math.round((raffle.tickets_sold / raffle.total_tickets) * 100)
  const fee = +(qty * raffle.ticket_price * 0.1).toFixed(2)
  const total = +(qty * raffle.ticket_price + fee).toFixed(2)

  const pad = n => String(n).padStart(2, '0')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← {lang === 'es' ? 'Regresar' : 'Back'}
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          {/* LEFT */}
          <div>
            {/* Hero image */}
            <div style={{
              height: 220, borderRadius: 12,
              background: raffle.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 72, marginBottom: 20,
              position: 'relative',
            }}>
              {raffle.emoji}
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.9)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 500, color: 'var(--brand-dark)' }}>
                📍 {raffle.location}
              </div>
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              {lang === 'es' ? raffle.title_es : raffle.title}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span>🛏 {raffle.beds} {lang === 'es' ? 'hab' : 'bed'}</span>
              <span>🚿 {raffle.baths} {lang === 'es' ? 'baños' : 'bath'}</span>
              <span>👥 {lang === 'es' ? 'hasta' : 'up to'} {raffle.guests} {lang === 'es' ? 'huéspedes' : 'guests'}</span>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {raffle.amenities.slice(0, 6).map(a => (
                <span key={a} style={{ fontSize: 11, background: '#F4F3EF', color: 'var(--muted)', padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>
                  {a}
                </span>
              ))}
            </div>

            {/* Description */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                {lang === 'es' ? 'Sobre la estancia' : 'About this stay'}
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>
                {lang === 'es' ? raffle.description_es : raffle.description_en}
              </p>
            </div>

            {/* Past winners */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                {lang === 'es' ? 'Ganadores anteriores' : 'Past winners'}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {PAST_WINNERS.map((w, i) => (
                  <div key={i} style={{ background: '#F4F3EF', borderRadius: 8, padding: '10px 12px', flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>😊</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{w.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{w.date} · {w.tickets} tickets</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — sticky panel */}
          <div style={{ position: 'sticky', top: 80 }}>
            {/* Countdown */}
            <div className="card" style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
                {lang === 'es' ? 'Sorteo en' : 'Draw in'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                {[['d', lang === 'es' ? 'días' : 'days'], ['h', lang === 'es' ? 'hrs' : 'hrs'], ['m', 'min'], ['s', 'sec']].map(([k, label]) => (
                  <div key={k} style={{ textAlign: 'center' }}>
                    <div className="countdown-digit">{pad(countdown[k])}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ fontWeight: 500 }}>{raffle.tickets_sold} {lang === 'es' ? 'vendidos' : 'sold'}</span>
                <span style={{ color: 'var(--muted)' }}>{raffle.total_tickets} total</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                {pct}% sold · {raffle.total_tickets - raffle.tickets_sold} {lang === 'es' ? 'restantes' : 'remaining'}
              </div>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>${raffle.ticket_price} USD</span>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{lang === 'es' ? 'por boleto' : 'per ticket'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 500 }}>${raffle.stay_value.toLocaleString()} prize</div>
              </div>
            </div>

            {/* Qty selector */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                {lang === 'es' ? '¿Cuántos boletos?' : 'How many tickets?'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', fontSize: 18, cursor: 'pointer', color: 'var(--text)' }}>−</button>
                <span style={{ fontSize: 18, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(20, q + 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', fontSize: 18, cursor: 'pointer', color: 'var(--text)' }}>+</button>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{qty} in {raffle.total_tickets} odds</span>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {[1, 3, 5, 10, 20].map(n => (
                  <button key={n} onClick={() => setQty(n)} style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                    border: '1px solid var(--border)',
                    background: qty === n ? 'var(--brand)' : 'transparent',
                    color: qty === n ? '#fff' : 'var(--muted)',
                  }}>
                    ×{n}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket number picker */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                {lang === 'es' ? 'Elige tus números' : 'Pick your numbers'} <span style={{ color: 'var(--brand)', fontSize: 10 }}>({selected.size} selected)</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                {Array.from({ length: raffle.total_tickets }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => toggleNum(n)}
                    className={`ticket-chip ${taken.has(n) ? 'taken' : ''} ${selected.has(n) ? 'selected' : ''}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: '#F4F3EF', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                <span>{qty} × ${raffle.ticket_price}</span><span>${(qty * raffle.ticket_price).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                <span>Platform fee (10%)</span><span>${fee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                <span>Total</span><span>${total} USD</span>
              </div>
            </div>

            <button
              onClick={pickRandom}
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '9px', fontSize: 12, cursor: 'pointer', color: 'var(--muted)', marginBottom: 8 }}
            >
              🍀 {lang === 'es' ? 'Elige por mí' : 'Pick for me'}
            </button>

            <Link
              href={`/checkout?raffle=${raffle.slug}&qty=${qty}&tickets=${[...selected].join(',')}`}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 8, fontSize: 14 }}
            >
              🔒 {lang === 'es' ? `Comprar — $${total} USD` : `Buy tickets — $${total} USD`}
            </Link>

            <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>
              ✓ {lang === 'es' ? 'Ganador garantizado · Reembolso si no se alcanza el mínimo' : 'Guaranteed winner · Full refund if minimum not reached'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
