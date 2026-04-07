import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'

export default function DashboardPage({ lang, setLang }) {
  const { user, loading, signOut, displayName, initials, avatarUrl, isHost } = useAuth({ required: true })
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()
  useEffect(() => { if (router.query.tab) setActiveTab(router.query.tab) }, [router.query.tab])
  const [purchases, setPurchases] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  const t = (en, es) => lang === 'es' ? es : en

  const tabs = [
    { id: 'overview', icon: '🏠', label: t('Overview', 'Resumen') },
    { id: 'tickets', icon: '🎟', label: t('My tickets', 'Mis boletos') },
    { id: 'won', icon: '🏆', label: t('Won stays', 'Ganadas') },
    { id: 'notifications', icon: '🔔', label: t('Notifications', 'Notificaciones') },
  ]

  // Cargar compras del usuario desde Supabase
  useEffect(() => {
    if (!user) return
    loadPurchases()
  }, [user])

  const loadPurchases = async () => {
    setLoadingData(true)
    const { data, error } = await supabase
      .from('purchases')
      .select('*, raffles(slug, draw_date, stay_date, ticket_price, currency, properties(name, city, country))')
      .eq('buyer_email', user.email)
      .order('created_at', { ascending: false })

    if (!error && data) setPurchases(data)
    setLoadingData(false)
  }

  const totalSpent = purchases.reduce((sum, p) => sum + (p.qty * (p.raffles?.ticket_price || 0)), 0)
  const activePurchases = purchases.filter(p => p.status === 'confirmed')
  const wonPurchases = purchases.filter(p => p.status === 'won')
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { month: 'short', year: 'numeric' }) : '—'

  // Mostrar loading mientras verifica auth
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>⏳ {t('Loading...', 'Cargando...')}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header con datos reales */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#185FA5', flexShrink: 0 }}>
              {avatarUrl ? <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>
                {t(`Hi, ${displayName} 👋`, `Hola, ${displayName} 👋`)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {t('Member since', 'Miembro desde')} {memberSince} · 🍀 {t('Lucky member', 'Lucky Viajero')}
              </div>
            </div>
          </div>
          {isHost && (<button onClick={() => router.push('/host')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: '1px solid var(--primary)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', marginRight: 8 }}>🏠 {lang === 'es' ? 'Panel anfitrión' : 'Host panel'}</button>)}<button onClick={signOut} style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
            {t('Sign out', 'Cerrar sesión')}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', fontSize: 13, cursor: 'pointer',
              background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--brand)' : 'var(--muted)',
              fontWeight: activeTab === tab.id ? 500 : 400,
              marginBottom: -1,
            }}>
              <span style={{ fontSize: 14 }}>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats reales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: t('Active tickets', 'Boletos activos'), val: activePurchases.reduce((s, p) => s + p.qty, 0).toString(), sub: `${activePurchases.length} ${t('raffles', 'rifas')}` },
                { label: t('Stays won', 'Estancias ganadas'), val: wonPurchases.length.toString(), sub: wonPurchases.length > 0 ? '🏆 ' + t('Winner!', '¡Ganador!') : t('Keep trying!', '¡Sigue intentando!'), green: wonPurchases.length > 0 },
                { label: t('Total spent', 'Total gastado'), val: `$${totalSpent.toFixed(0)}`, sub: `${purchases.length} ${t('purchases', 'compras')}` },
                { label: t('Win rate', 'Tasa de ganancia'), val: purchases.length > 0 ? `${Math.round((wonPurchases.length / purchases.length) * 100)}%` : '—', sub: t('All time', 'Histórico'), green: wonPurchases.length > 0 },
              ].map((m, i) => (
                <div key={i} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5 }}>{m.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{m.val}</div>
                  <div style={{ fontSize: 10, color: m.green ? 'var(--brand)' : 'var(--muted)', marginTop: 2 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Si no hay compras todavia */}
            {loadingData ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: 13 }}>
                ⏳ {t('Loading your tickets...', 'Cargando tus boletos...')}
              </div>
            ) : purchases.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎟</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  {t("You haven't entered any raffles yet", 'Todavía no has participado en ninguna rifa')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
                  {t('Browse active raffles and buy your first ticket', 'Explora las rifas activas y compra tu primer boleto')}
                </div>
                <Link href="/raffles" className="btn-primary">
                  {t('Browse raffles', 'Ver rifas activas')}
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Compras recientes */}
                <div className="card">
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                    {t('Recent entries', 'Participaciones recientes')}
                  </div>
                  {purchases.slice(0, 3).map((p, i) => (
                    <div key={p.id} style={{ padding: '10px 0', borderBottom: i < Math.min(purchases.length, 3) - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 40, height: 33, borderRadius: 5, background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏡</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{p.raffles?.properties?.name || p.raffle_slug}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>📍 {p.raffles?.properties?.city || '—'}</div>
                          <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                            {(p.ticket_numbers || []).slice(0, 5).map(n => (
                              <span key={n} style={{ width: 24, height: 24, borderRadius: 4, background: '#E6F1FB', color: '#185FA5', fontSize: 10, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
                            ))}
                            {(p.ticket_numbers || []).length > 5 && <span style={{ fontSize: 10, color: 'var(--muted)', alignSelf: 'center' }}>+{p.ticket_numbers.length - 5}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>${(p.qty * (p.raffles?.ticket_price || 0)).toFixed(0)}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.qty} {t('tickets', 'boletos')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {purchases.length > 3 && (
                    <button onClick={() => setActiveTab('tickets')} style={{ width: '100%', marginTop: 10, fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {t('See all', 'Ver todos')} ({purchases.length}) →
                    </button>
                  )}
                </div>

                {/* Quick actions */}
                <div className="card">
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                    {t('Quick actions', 'Acciones rápidas')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Link href="/raffles" className="btn-primary" style={{ justifyContent: 'center', fontSize: 13 }}>
                      🎟 {t('Browse raffles', 'Ver rifas activas')}
                    </Link>
                    <button onClick={() => setActiveTab('tickets')} className="btn-secondary" style={{ fontSize: 13 }}>
                      📋 {t('My tickets', 'Mis boletos')}
                    </button>
                    <button onClick={signOut} style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>
                      🚪 {t('Sign out', 'Cerrar sesión')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MY TICKETS */}
        {activeTab === 'tickets' && (
          <div>
            {loadingData ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: 13 }}>
                ⏳ {t('Loading...', 'Cargando...')}
              </div>
            ) : purchases.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎟</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  {t('No tickets yet', 'Sin boletos todavía')}
                </div>
                <Link href="/raffles" className="btn-primary">{t('Browse raffles', 'Ver rifas')}</Link>
              </div>
            ) : (
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
                  {t('All purchases', 'Todas las compras')} ({purchases.length})
                </div>
                {purchases.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < purchases.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 48, height: 40, borderRadius: 6, background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏡</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.raffles?.properties?.name || p.raffle_slug}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                        🎯 {t('Draw:', 'Sorteo:')} {p.raffles?.draw_date ? new Date(p.raffles.draw_date + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </div>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {(p.ticket_numbers || []).map(n => (
                          <span key={n} style={{ width: 26, height: 26, borderRadius: 4, background: p.status === 'won' ? 'var(--brand)' : '#E6F1FB', color: p.status === 'won' ? '#fff' : '#185FA5', fontSize: 10, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>${(p.qty * (p.raffles?.ticket_price || 0)).toFixed(2)} {p.raffles?.currency || 'MXN'}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.qty} {t('tickets', 'boletos')}</div>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: p.status === 'won' ? 'var(--brand)' : p.status === 'confirmed' ? '#E6F1FB' : '#F4F3EF', color: p.status === 'won' ? '#fff' : p.status === 'confirmed' ? '#185FA5' : 'var(--muted)', marginTop: 4, display: 'inline-block' }}>
                        {p.status === 'won' ? '🏆 ' + t('Won!', '¡Ganado!') : p.status === 'confirmed' ? t('Active', 'Activo') : t('Completed', 'Completado')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WON STAYS */}
        {activeTab === 'won' && (
          <div>
            {wonPurchases.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🍀</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  {t('No wins yet — keep trying!', 'Todavía sin ganancias — ¡sigue intentando!')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
                  {t('Every ticket is a chance. The more you play, the better your odds.', 'Cada boleto es una oportunidad. Cuanto más juegas, mayores son tus chances.')}
                </div>
                <Link href="/raffles" className="btn-primary">{t('Browse raffles', 'Ver rifas')}</Link>
              </div>
            ) : wonPurchases.map(p => (
              <div key={p.id} className="card" style={{ overflow: 'hidden', padding: 0, marginBottom: 16 }}>
                <div style={{ height: 100, background: 'linear-gradient(135deg,#1A6B3C,#2E8B57)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, position: 'relative' }}>
                  🏆
                  <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--brand)', color: '#fff', fontSize: 10, fontWeight: 500, padding: '3px 10px', borderRadius: 10 }}>🏆 {t('Won', 'Ganado')}</div>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{p.raffles?.properties?.name || p.raffle_slug}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>📍 {p.raffles?.properties?.city}, {p.raffles?.properties?.country}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {[
                      ['🎟 ' + t('Tickets', 'Boletos'), (p.ticket_numbers || []).join(', ')],
                      ['💰 ' + t('Paid', 'Pagado'), `$${(p.qty * (p.raffles?.ticket_price || 0)).toFixed(0)} ${p.raffles?.currency || 'MXN'}`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ fontSize: 11, background: '#F4F3EF', padding: '4px 10px', borderRadius: 6, color: 'var(--muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>{k}:</strong> {v}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn-secondary" style={{ fontSize: 12 }}>📤 {t('Share win', 'Compartir')}</button>
                    <Link href="/raffles" className="btn-secondary" style={{ fontSize: 12 }}>🔁 {t('Raffle again', 'Participar de nuevo')}</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              {t('Notifications coming soon', 'Notificaciones próximamente')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {t("We'll notify you when your draw is near or if you win.", 'Te notificaremos cuando tu sorteo esté cerca o si ganas.')}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
