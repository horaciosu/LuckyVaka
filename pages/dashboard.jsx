import { useState } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function DashboardPage({ lang, setLang }) {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', icon: '🏠', label: 'Overview' },
    { id: 'tickets', icon: '🎟', label: lang === 'es' ? 'Mis boletos' : 'My tickets' },
    { id: 'won', icon: '🏆', label: lang === 'es' ? 'Ganadas' : 'Won stays' },
    { id: 'notifications', icon: '🔔', label: lang === 'es' ? 'Notificaciones' : 'Notifications' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#185FA5' }}>CM</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>
              {lang === 'es' ? 'Hola, Carlos 👋' : 'Hi Carlos 👋'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Member since Jan 2025 · 🍀 Lucky member</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', fontSize: 13, cursor: 'pointer',
              background: 'transparent', border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
              color: activeTab === t.id ? 'var(--brand)' : 'var(--muted)',
              fontWeight: activeTab === t.id ? 500 : 400,
              marginBottom: -1,
            }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: lang === 'es' ? 'Boletos activos' : 'Active tickets', val: '8', sub: 'in 2 raffles' },
                { label: lang === 'es' ? 'Estancias ganadas' : 'Stays won', val: '1', sub: '🏖 San Carlos', green: true },
                { label: lang === 'es' ? 'Total gastado' : 'Total spent', val: '$57', sub: '4 raffles' },
                { label: lang === 'es' ? 'Tasa de ganancia' : 'Win rate', val: '25%', sub: '↑ above avg', green: true },
              ].map((m, i) => (
                <div key={i} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5 }}>{m.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{m.val}</div>
                  <div style={{ fontSize: 10, color: m.green ? 'var(--brand)' : 'var(--muted)', marginTop: 2 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Won stay banner */}
            <div className="card" style={{ marginBottom: 16, border: '1px solid var(--brand)' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 72, height: 56, borderRadius: 8, background: 'linear-gradient(135deg,#b3e0f7,#81c8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🌊</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>🏆 Beach House — San Carlos, Sonora</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>2 bedrooms · Ocean view · Stay: Feb 15–17, 2025</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, background: 'var(--brand-light)', color: 'var(--brand-dark)', padding: '2px 8px', borderRadius: 4 }}>✓ Stay completed</span>
                    <span style={{ fontSize: 10, background: '#F4F3EF', color: 'var(--muted)', padding: '2px 8px', borderRadius: 4 }}>Winning ticket: #203</span>
                    <span style={{ fontSize: 10, background: '#F4F3EF', color: 'var(--muted)', padding: '2px 8px', borderRadius: 4 }}>⭐ Rated 5/5</span>
                  </div>
                </div>
                <button onClick={() => setActiveTab('won')} className="btn-secondary" style={{ fontSize: 12, padding: '7px 14px' }}>
                  {lang === 'es' ? 'Ver detalles' : 'View details'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Active draws */}
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                  {lang === 'es' ? 'Sorteos activos' : 'Active draws'}
                </div>
                {[
                  { emoji: '🌊', name: 'Beach House — San Carlos', loc: 'Draw Jul 8', nums: [47, 112, 203], pct: 62, amount: '$15', odds: '3 in 300' },
                  { emoji: '🏡', name: 'Modern Home — Tucson AZ', loc: 'Draw Apr 15', nums: [19, 88, 155], pct: 78, amount: '$50', odds: '5 in 400' },
                ].map((r, i) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 40, height: 33, borderRadius: 5, background: i === 0 ? 'linear-gradient(135deg,#b3e0f7,#81c8f0)' : 'linear-gradient(135deg,#c8e6c9,#a5d6a7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{r.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>📍 {r.loc}</div>
                        <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                          {r.nums.map(n => <span key={n} style={{ width: 24, height: 24, borderRadius: 4, background: '#E6F1FB', color: '#185FA5', fontSize: 10, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{r.amount}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{r.odds}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notifications */}
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                  {lang === 'es' ? 'Notificaciones recientes' : 'Recent notifications'}
                </div>
                {[
                  { dot: '#EF9F27', text: 'Draw tomorrow! Tucson closes in 18 hrs', time: '2 hrs ago' },
                  { dot: '#378ADD', text: 'San Carlos is 62% sold — 113 remaining', time: 'Yesterday' },
                  { dot: 'var(--brand)', text: '🎉 You won the San Carlos Feb draw!', time: 'Feb 10' },
                ].map((n, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: n.dot, flexShrink: 0, marginTop: 5 }} />
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>{n.text}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MY TICKETS */}
        {activeTab === 'tickets' && (
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
                {lang === 'es' ? 'Activos' : 'Active'}
              </div>
              {[
                { emoji: '🌊', grad: 'linear-gradient(135deg,#b3e0f7,#81c8f0)', name: 'Beach House — San Carlos MX', loc: 'Draw: Jul 8, 2025', nums: [47, 112, 203], badge: '7 days left', badgeBg: '#FAEEDA', badgeCol: '#633806', amount: '$15.00', odds: '3 tickets' },
                { emoji: '🏡', grad: 'linear-gradient(135deg,#c8e6c9,#a5d6a7)', name: 'Modern Home — Tucson AZ', loc: 'Draw: Apr 15, 2025', nums: [19, 88, 155, 207, 291], badge: 'Draw in 13 days', badgeBg: '#FAEEDA', badgeCol: '#633806', amount: '$50.00', odds: '5 tickets' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 48, height: 40, borderRadius: 6, background: r.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{r.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>📍 {r.loc}</div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 5 }}>
                      {r.nums.map(n => <span key={n} style={{ width: 26, height: 26, borderRadius: 4, background: '#E6F1FB', color: '#185FA5', fontSize: 10, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>)}
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: r.badgeBg, color: r.badgeCol }}>{r.badge}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.amount}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{r.odds}</div>
                    <Link href={`/raffle/${i === 0 ? 'beach-house-san-carlos' : 'modern-home-tucson'}`} style={{ fontSize: 10, color: 'var(--brand)', textDecoration: 'none', display: 'block', marginTop: 4 }}>+ Add tickets</Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
                {lang === 'es' ? 'Historial' : 'Past entries'}
              </div>
              <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 48, height: 40, borderRadius: 6, background: 'linear-gradient(135deg,#b3e0f7,#81c8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🌊</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Beach House — San Carlos MX</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Draw: Feb 10, 2025</div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <span style={{ width: 26, height: 26, borderRadius: 4, background: 'var(--brand)', color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>203</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>$10.00</div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--brand)', color: '#fff' }}>🏆 Won!</span>
                  <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: 3 }}>$1,200 stay</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WON STAYS */}
        {activeTab === 'won' && (
          <div>
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ height: 120, background: 'linear-gradient(135deg,#b3e0f7,#81c8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, position: 'relative' }}>
                🌊
                <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--brand)', color: '#fff', fontSize: 10, fontWeight: 500, padding: '3px 10px', borderRadius: 10 }}>🏆 Won</div>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Beach House — San Carlos, Sonora MX</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>2 bedrooms · Ocean view · Full kitchen · A/C</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {[
                    ['🎯 Won', 'Feb 10, 2025'],
                    ['🗓 Stay', 'Feb 15–17, 2025'],
                    ['🎟 Ticket', '#203'],
                    ['💰 Value', '$1,200 USD'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ fontSize: 11, background: '#F4F3EF', padding: '4px 10px', borderRadius: 6, color: 'var(--muted)' }}>
                      <strong style={{ color: 'var(--text)' }}>{k}:</strong> {v}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-primary" style={{ fontSize: 12 }}>View details</button>
                  <button className="btn-secondary" style={{ fontSize: 12 }}>📤 Share win</button>
                  <Link href="/" className="btn-secondary" style={{ fontSize: 12 }}>🔁 Raffle again</Link>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                {lang === 'es' ? 'Comparte tu experiencia' : 'Share your experience'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, maxWidth: 340, margin: '0 auto 14px' }}>
                {lang === 'es' ? 'Comparte tu historia y consigue $5 de descuento en tu próxima rifa.' : 'Share your story and get $5 off your next raffle entry.'}
              </div>
              <button className="btn-primary">
                {lang === 'es' ? 'Compartir mi historia' : 'Share my story'}
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="card">
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>NEW</div>
            {[
              { dot: '#EF9F27', text: '⚡ Draw tomorrow! Tucson closes in 18 hours. Fingers crossed!', time: '2 hours ago', unread: true },
              { dot: '#378ADD', text: 'San Carlos is now 62% sold — 113 tickets still available. Buy more to increase your odds.', time: 'Yesterday', unread: true },
              { dot: 'var(--brand)', text: '🎉 You won! Ticket #203 won the San Carlos Feb draw. Check email for check-in details.', time: 'Feb 10', unread: true },
            ].map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', background: n.unread ? '#F0F7FF' : 'transparent', margin: '0 -20px', padding: '10px 20px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.dot, flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{n.text}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{n.time}</div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: 'var(--muted)', margin: '14px 0 8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>EARLIER</div>
            {[
              { text: 'Your payment of $15.00 for San Carlos was confirmed.', time: 'Apr 1' },
              { text: 'Copper Canyon draw completed. Better luck next round!', time: 'Jan 5' },
            ].map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--subtle)', flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{n.text}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{n.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
