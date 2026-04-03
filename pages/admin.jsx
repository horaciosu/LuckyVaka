import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

const ADMIN_EMAIL = 'horaciosoriau@gmail.com'

export default function AdminPage({ lang, setLang }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState([])
  const [raffles, setRaffles] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ properties: 0, raffles: 0, active: 0, drafts: 0 })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (!u || u.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      setUser(u)
      setLoading(false)
      loadData()
    })
  }, [])

  const loadData = async () => {
    const [propsRes, rafflesRes] = await Promise.all([
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('raffles').select('*, properties(name, city)').order('created_at', { ascending: false }),
    ])
    const props = propsRes.data || []
    const rafs = rafflesRes.data || []
    setProperties(props)
    setRaffles(rafs)
    setStats({
      properties: props.length,
      raffles: rafs.length,
      active: rafs.filter(r => r.status === 'active').length,
      drafts: rafs.filter(r => r.status === 'draft').length,
    })
  }

  const updatePropertyStatus = async (id, status) => {
    await supabase.from('properties').update({ status }).eq('id', id)
    loadData()
  }

  const updateRaffleStatus = async (id, status) => {
    await supabase.from('raffles').update({ status }).eq('id', id)
    loadData()
  }

  const t = (en, es) => lang === 'es' ? es : en

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Loading admin panel...</div>
    </div>
  )

  const tabs = [
    { id: 'overview', icon: '📊', label: t('Overview', 'Resumen') },
    { id: 'properties', icon: '🏡', label: t('Properties', 'Propiedades') },
    { id: 'raffles', icon: '🎟', label: t('Raffles', 'Rifas') },
    { id: 'registrations', icon: '📋', label: t('Registrations', 'Registros') },
  ]

  const statusBadge = (status) => {
    const map = {
      active:   { bg: '#E1F5EE', color: '#0F6E56', label: 'Active' },
      draft:    { bg: '#F4F3EF', color: 'var(--muted)', label: 'Draft' },
      pending:  { bg: '#FAEEDA', color: '#633806', label: 'Pending' },
      approved: { bg: '#E1F5EE', color: '#0F6E56', label: 'Approved' },
      rejected: { bg: '#FCEBEB', color: '#A32D2D', label: 'Rejected' },
      completed:{ bg: '#E6F1FB', color: '#185FA5', label: 'Completed' },
    }
    const s = map[status] || map.draft
    return (
      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, fontWeight: 500 }}>
        {s.label}
      </span>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
              🔐 {t('Admin Panel', 'Panel de administrador')}
            </h1>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Lucky Vaka · {t('Super admin', 'Super administrador')} · {user?.email}
            </div>
          </div>
          <button onClick={loadData} className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}>
            🔄 {t('Refresh', 'Actualizar')}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', fontSize: 13, cursor: 'pointer',
              background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--brand)' : 'var(--muted)',
              fontWeight: activeTab === tab.id ? 500 : 400,
              marginBottom: -1,
            }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: t('Total properties', 'Propiedades totales'), val: stats.properties, icon: '🏡', color: 'var(--brand)' },
                { label: t('Total raffles', 'Rifas totales'), val: stats.raffles, icon: '🎟', color: '#378ADD' },
                { label: t('Active raffles', 'Rifas activas'), val: stats.active, icon: '🟢', color: '#1D9E75' },
                { label: t('Drafts', 'Borradores'), val: stats.drafts, icon: '📝', color: '#EF9F27' },
              ].map((m, i) => (
                <div key={i} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: m.color }}>{m.val}</div>
                </div>
              ))}
            </div>

            {/* Pending approvals */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
                ⏳ {t('Pending approvals', 'Aprobaciones pendientes')}
              </div>
              {properties.filter(p => p.status === 'pending').length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
                  ✅ {t('No pending approvals', 'Sin aprobaciones pendientes')}
                </div>
              ) : (
                properties.filter(p => p.status === 'pending').map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.city} · {p.country}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updatePropertyStatus(p.id, 'approved')}
                        style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, border: '1px solid #9FE1CB', background: '#E1F5EE', color: '#0F6E56', cursor: 'pointer' }}>
                        ✓ {t('Approve', 'Aprobar')}
                      </button>
                      <button onClick={() => updatePropertyStatus(p.id, 'rejected')}
                        style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, border: '1px solid #F7C1C1', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>
                        ✗ {t('Reject', 'Rechazar')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Recent raffles */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
                🎟 {t('Recent raffles', 'Rifas recientes')}
              </div>
              {raffles.slice(0, 5).map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text)' }}>{r.properties?.name || '—'}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 11 }}>{r.ticket_price} {r.currency} · {r.total_tickets} tickets</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {statusBadge(r.status)}
                    {r.status === 'draft' && (
                      <button onClick={() => updateRaffleStatus(r.id, 'active')}
                        style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--brand)', background: 'var(--brand-light)', color: 'var(--brand-dark)', cursor: 'pointer' }}>
                        {t('Activate', 'Activar')}
                      </button>
                    )}
                    {r.status === 'active' && (
                      <button onClick={() => updateRaffleStatus(r.id, 'draft')}
                        style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border)', background: '#F4F3EF', color: 'var(--muted)', cursor: 'pointer' }}>
                        {t('Pause', 'Pausar')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROPERTIES */}
        {activeTab === 'properties' && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
              {t('All properties', 'Todas las propiedades')} ({properties.length})
            </div>
            {properties.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
                {t('No properties registered yet', 'No hay propiedades registradas aún')}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[t('Property','Propiedad'), t('Location','Ubicación'), t('Status','Estado'), t('Actions','Acciones')].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {properties.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--muted)' }}>{p.city}, {p.country}</td>
                      <td style={{ padding: '10px 8px' }}>{statusBadge(p.status)}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {p.status !== 'approved' && (
                            <button onClick={() => updatePropertyStatus(p.id, 'approved')}
                              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid #9FE1CB', background: '#E1F5EE', color: '#0F6E56', cursor: 'pointer' }}>
                              ✓ {t('Approve','Aprobar')}
                            </button>
                          )}
                          {p.status !== 'rejected' && (
                            <button onClick={() => updatePropertyStatus(p.id, 'rejected')}
                              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid #F7C1C1', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>
                              ✗ {t('Reject','Rechazar')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* RAFFLES */}
        {activeTab === 'raffles' && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
              {t('All raffles', 'Todas las rifas')} ({raffles.length})
            </div>
            {raffles.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
                {t('No raffles created yet', 'No hay rifas creadas aún')}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[t('Property','Propiedad'), t('Price','Precio'), t('Tickets','Boletos'), t('Draw','Sorteo'), t('Status','Estado'), t('Actions','Acciones')].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {raffles.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 500 }}>{r.properties?.name || '—'}</td>
                      <td style={{ padding: '10px 8px' }}>{r.ticket_price} {r.currency}</td>
                      <td style={{ padding: '10px 8px' }}>{r.tickets_sold}/{r.total_tickets}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--muted)' }}>{r.draw_date || '—'}</td>
                      <td style={{ padding: '10px 8px' }}>{statusBadge(r.status)}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {r.status === 'draft' && (
                            <button onClick={() => updateRaffleStatus(r.id, 'active')}
                              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--brand)', background: 'var(--brand-light)', color: 'var(--brand-dark)', cursor: 'pointer' }}>
                              {t('Activate','Activar')}
                            </button>
                          )}
                          {r.status === 'active' && (
                            <button onClick={() => updateRaffleStatus(r.id, 'completed')}
                              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid #B5D4F4', background: '#E6F1FB', color: '#185FA5', cursor: 'pointer' }}>
                              {t('Complete','Completar')}
                            </button>
                          )}
                          {(r.status === 'active' || r.status === 'draft') && (
                            <button onClick={() => updateRaffleStatus(r.id, 'cancelled')}
                              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, border: '1px solid #F7C1C1', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>
                              {t('Cancel','Cancelar')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REGISTRATIONS */}
        {activeTab === 'registrations' && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              📋 {t('Host registrations', 'Registros de anfitriones')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6, background: '#E6F1FB', padding: '10px 14px', borderRadius: 8 }}>
              📧 {t('Host registration forms are sent to', 'Los formularios de registro llegan a')} <strong>luckyvaka.hola@gmail.com</strong>.
              {t(' Match the folio number in the email subject with the documents received.', ' Empareja el número de folio del asunto del email con los documentos recibidos.')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
              {t('Check luckyvaka.hola@gmail.com for registration emails with folio numbers.', 'Revisa luckyvaka.hola@gmail.com para ver los emails de registro con números de folio.')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
