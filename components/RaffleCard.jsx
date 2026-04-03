import Link from 'next/link'

export default function RaffleCard({ raffle, lang = 'en' }) {
  const ticketsSold = raffle.ticketsSold ?? raffle.tickets_sold ?? 0
  const totalTickets = raffle.totalTickets ?? raffle.total_tickets ?? 1
  const ticketPrice = raffle.ticketPrice ?? raffle.ticket_price ?? 0
  const currency = raffle.currency || 'USD'
  const prize = raffle.prize ?? raffle.stay_value ?? 0
  const pct = Math.round((ticketsSold / totalTickets) * 100)
  const remaining = totalTickets - ticketsSold

  const drawDate = raffle.drawDate || raffle.draw_date
  const diffDays = drawDate
    ? Math.ceil((new Date(drawDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  // Use real photo if available, otherwise gradient + emoji
  const firstPhoto = raffle.images?.[0]
  const gradient = raffle.gradient || (raffle.location?.includes('MX') ? 'linear-gradient(135deg, #a8edea, #fed6e3)' : 'linear-gradient(135deg, #d4fc79, #96e6a1)')

  return (
    <Link href={`/raffle/${raffle.slug}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        {/* Image or gradient */}
        <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
          {firstPhoto ? (
            <img src={firstPhoto} alt={raffle.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>
              {raffle.emoji || '🏡'}
            </div>
          )}
          {diffDays !== null && diffDays <= 3 && diffDays > 0 && (
            <div style={{ position: 'absolute', top: 10, right: 10, background: '#FAEEDA', color: '#633806', fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20 }}>
              ⚡ {diffDays}d left
            </div>
          )}
          {pct >= 90 && (
            <div style={{ position: 'absolute', top: 10, left: 10, background: '#FCEBEB', color: '#A32D2D', fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20 }}>
              {lang === 'es' ? 'Casi agotado' : 'Almost sold out'}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>📍 {raffle.location}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
            {lang === 'es' ? (raffle.title_es || raffle.title) : raffle.title}
          </div>

          <div className="progress-bar" style={{ marginBottom: 6 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
            <span>{ticketsSold} {lang === 'es' ? 'vendidos' : 'sold'}</span>
            <span>{pct}%</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                {ticketPrice} {currency}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{lang === 'es' ? 'por boleto' : 'per ticket'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 500 }}>
                {Number(prize).toLocaleString()} {currency} {lang === 'es' ? 'en juego' : 'prize'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                {remaining} {lang === 'es' ? 'restantes' : 'remaining'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
