import Link from 'next/link'

export default function RaffleCard({ raffle, lang = 'en' }) {
  const pct = Math.round((raffle.tickets_sold / raffle.total_tickets) * 100)
  const remaining = raffle.total_tickets - raffle.tickets_sold

  const drawDate = new Date(raffle.draw_date)
  const today = new Date()
  const diffDays = Math.ceil((drawDate - today) / (1000 * 60 * 60 * 24))

  return (
    <Link href={`/raffle/${raffle.slug}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        padding: 0,
        overflow: 'hidden',
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      >
        {/* Image */}
        <div style={{
          height: 140,
          background: raffle.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          position: 'relative',
        }}>
          {raffle.emoji}
          {diffDays <= 3 && diffDays > 0 && (
            <div style={{
              position: 'absolute', top: 10, right: 10,
              background: '#FAEEDA', color: '#633806',
              fontSize: 10, fontWeight: 500,
              padding: '3px 8px', borderRadius: 20,
            }}>
              ⚡ {diffDays}d left
            </div>
          )}
          {pct >= 90 && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: '#FCEBEB', color: '#A32D2D',
              fontSize: 10, fontWeight: 500,
              padding: '3px 8px', borderRadius: 20,
            }}>
              Almost sold out
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>
            📍 {raffle.location}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
            {lang === 'es' ? raffle.title_es : raffle.title}
          </div>

          {/* Progress */}
          <div className="progress-bar" style={{ marginBottom: 6 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
            <span>{raffle.tickets_sold} {lang === 'es' ? 'vendidos' : 'sold'}</span>
            <span>{pct}%</span>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                ${raffle.ticket_price} USD
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                {lang === 'es' ? 'por boleto' : 'per ticket'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 500 }}>
                ${raffle.stay_value.toLocaleString()} {lang === 'es' ? 'en juego' : 'prize'}
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
