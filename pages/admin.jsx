import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const t = (en, es) => es

// ─── STATUS BADGES ───────────────────────────────────────────────────────────
const STATUS = {
  pending_review: { label: 'En revisión', color: '#F59E0B', bg: '#FEF3C7' },
  approved:       { label: 'Aprobado',    color: '#10B981', bg: '#D1FAE5' },
  rejected:       { label: 'Rechazado',   color: '#EF4444', bg: '#FEE2E2' },
  pending:        { label: 'Pendiente',   color: '#F59E0B', bg: '#FEF3C7' },
  active:         { label: 'Activa',      color: '#10B981', bg: '#D1FAE5' },
  draft:          { label: 'Borrador',    color: '#6B7280', bg: '#F3F4F6' },
  completed:      { label: 'Completada', color: '#3B82F6', bg: '#DBEAFE' },
  cancelled:      { label: 'Cancelada',  color: '#EF4444', bg: '#FEE2E2' },
  host:           { label: 'Anfitrión',  color: '#8B5CF6', bg: '#EDE9FE' },
  guest:          { label: 'Viajero',    color: '#6B7280', bg: '#F3F4F6' },
}

const Badge = ({ status }) => {
  const s = STATUS[status] || STATUS.draft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: s.color, background: s.bg, letterSpacing: '0.02em'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  )
}

// ─── DOCUMENT VIEWER MODAL ───────────────────────────────────────────────────
const DOC_LABELS = {
  deed_doc_url:       'Escrituras / Título',
  address_doc_url:    'Comprobante domicilio',
  fiscal_doc_url:     'Constancia fiscal (RFC)',
  id_front_doc_url:   'INE Frente',
  id_back_doc_url:    'INE Reverso',
  passport_doc_url:   'Pasaporte',
  curp_doc_url:       'CURP',
}

const DocModal = ({ property, onClose }) => {
  const docs = Object.entries(DOC_LABELS).filter(([key]) => property[key])

  const getSignedUrl = async (path) => {
    const { data } = await supabase.storage.from('host-documents').createSignedUrl(path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const handleDoc = (url) => {
    if (!url) return
    if (url.startsWith('http')) { window.open(url, '_blank'); return }
    getSignedUrl(url)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, width: 520, maxWidth: '95vw',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>📄 Documentos</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{property.name}</div>
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14, color: '#374151' }}>✕ Cerrar</button>
        </div>

        {docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 14 }}>
            No hay documentos subidos aún.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map(([key, label]) => (
              <button key={key} onClick={() => handleDoc(property[key])} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: '#F9FAFB', border: '1px solid #E5E7EB',
                borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                fontSize: 13, color: '#374151', fontWeight: 500, textAlign: 'left'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#6366F1' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB' }}
              >
                <span>📎 {label}</span>
                <span style={{ fontSize: 11, color: '#6366F1', fontWeight: 600 }}>Ver →</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color = '#6366F1', sub }) => (
  <div style={{
    background: '#fff', borderRadius: 14, padding: '20px 24px',
    border: '1px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', gap: 8
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, lineHeight: 1 }}>{icon}</div>
    </div>
    <div style={{ fontSize: 32, fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{sub}</div>}
  </div>
)

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
const SectionHeader = ({ title, count, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{title}</span>
      {count !== undefined && (
        <span style={{ fontSize: 11, background: '#EEF2FF', color: '#6366F1', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
          {count}
        </span>
      )}
    </div>
    {action}
  </div>
)

// ─── TABLE WRAPPER ────────────────────────────────────────────────────────────
const Table = ({ cols, rows, empty = 'Sin datos' }) => (
  <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #F3F4F6' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: '#F9FAFB' }}>
          {cols.map((c, i) => (
            <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={cols.length} style={{ padding: '32px 16px', textAlign: 'center', color: '#9CA3AF' }}>{empty}</td></tr>
        ) : rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid #F9FAFB' : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {row.map((cell, j) => (
              <td key={j} style={{ padding: '12px 16px', color: '#374151', verticalAlign: 'middle' }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

// ─── ACTION BUTTON ────────────────────────────────────────────────────────────
const Btn = ({ onClick, children, variant = 'default', disabled }) => {
  const variants = {
    default: { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' },
    approve: { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
    reject:  { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
    primary: { bg: '#6366F1', color: '#fff',    border: '#6366F1' },
  }
  const v = variants[variant]
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '5px 12px', borderRadius: 7, border: `1px solid ${v.border}`,
      background: v.bg, color: v.color, fontSize: 11, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      transition: 'all 0.15s', whiteSpace: 'nowrap'
    }}>
      {children}
    </button>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Admin({ lang, setLang }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [properties, setProperties] = useState([])
  const [raffles, setRaffles] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [users, setUsers] = useState([])
  const [hosts, setHosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState(null)
  const [docModal, setDocModal] = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const role = user.user_metadata?.role
    if (role !== 'admin') { router.push('/'); return }
    setAdminUser(user)
    fetchAll()
  }

  const fetchAll = async () => {
    setLoading(true)
    const [propsRes, rafflesRes, regsRes] = await Promise.all([
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('raffles').select('*, properties(name, city)').order('created_at', { ascending: false }),
      supabase.from('host_applications').select('*').order('created_at', { ascending: false }),
    ])
    setProperties(propsRes.data || [])
    setRaffles(rafflesRes.data || [])
    setRegistrations(regsRes.data || [])

    // Fetch users via service role API
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin-users', {
        headers: { Authorization: 'Bearer ' + session?.access_token }
      })
      if (res.ok) {
        const data = await res.json()
        const allUsers = data.users || []
        setUsers(allUsers)
        setHosts(allUsers.filter(u => u.user_metadata?.role === 'host'))
      }
    } catch {}

    setLoading(false)
  }

  const setAction = (id, val) => setActionLoading(p => ({ ...p, [id]: val }))

  const updatePropertyStatus = async (id, status) => {
    setAction(id, true)
    await supabase.from('properties').update({ status }).eq('id', id)
    setProperties(p => p.map(x => x.id === id ? { ...x, status } : x))
    setAction(id, false)
  }

  const updateRaffleStatus = async (id, status) => {
    setAction(id, true)
    await supabase.from('raffles').update({ status }).eq('id', id)
    setRaffles(r => r.map(x => x.id === id ? { ...x, status } : x))
    setAction(id, false)
  }

  const handleRegistration = async (reg, action) => {
    setAction(reg.id, true)
    try {
      const res = await fetch('/api/approve-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: reg.id, userId: reg.user_id, action })
      })
      if (res.ok) {
        setRegistrations(r => r.map(x => x.id === reg.id ? { ...x, status: action === 'approve' ? 'approved' : 'rejected' } : x))
      }
    } finally { setAction(reg.id, false) }
  }

  const fmt = (date) => date ? new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'
  const fmtMoney = (n) => n ? `$${Number(n).toLocaleString()}` : '—'

  const TABS = [
    { id: 'overview',      icon: '📊', label: 'Resumen' },
    { id: 'properties',    icon: '🏠', label: 'Propiedades' },
    { id: 'raffles',       icon: '🎟️', label: 'Rifas' },
    { id: 'hosts',         icon: '🧑‍💼', label: 'Anfitriones' },
    { id: 'users',         icon: '👥', label: 'Usuarios' },
    { id: 'registrations', icon: '📋', label: 'Registros' },
  ]

  const pendingProps = properties.filter(p => p.status === 'pending_review')
  const pendingRegs  = registrations.filter(r => r.status === 'pending')

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
        <div style={{ fontSize: 14, color: '#6B7280' }}>Cargando panel...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── TOP BAR ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #F3F4F6',
        padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⭐</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#111', letterSpacing: '-0.02em' }}>LuckyVaka</span>
          <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 20, fontWeight: 700, marginLeft: 4 }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {(pendingProps.length > 0 || pendingRegs.length > 0) && (
            <div style={{ display: 'flex', gap: 8 }}>
              {pendingProps.length > 0 && (
                <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: 20, fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setActiveTab('properties')}>
                  🏠 {pendingProps.length} pendiente{pendingProps.length > 1 ? 's' : ''}
                </span>
              )}
              {pendingRegs.length > 0 && (
                <span style={{ fontSize: 11, background: '#FEE2E2', color: '#991B1B', padding: '3px 10px', borderRadius: 20, fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setActiveTab('registrations')}>
                  📋 {pendingRegs.length} registro{pendingRegs.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          <button onClick={fetchAll} style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
            ↻ Actualizar
          </button>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700 }}>
            {adminUser?.email?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── SIDEBAR ── */}
        <div style={{
          width: 200, flexShrink: 0, padding: '24px 12px',
          position: 'sticky', top: 56, height: 'calc(100vh - 56px)', overflowY: 'auto'
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            const badge = tab.id === 'properties' ? pendingProps.length : tab.id === 'registrations' ? pendingRegs.length : 0
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: isActive ? '#EEF2FF' : 'transparent',
                color: isActive ? '#6366F1' : '#6B7280',
                fontWeight: isActive ? 700 : 500, fontSize: 13,
                marginBottom: 2, transition: 'all 0.15s', textAlign: 'left', justifyContent: 'space-between'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15 }}>{tab.icon}</span>
                  {tab.label}
                </span>
                {badge > 0 && (
                  <span style={{ fontSize: 10, background: '#EF4444', color: '#fff', padding: '1px 6px', borderRadius: 20, fontWeight: 800 }}>{badge}</span>
                )}
              </button>
            )
          })}

          <div style={{ marginTop: 24, padding: '12px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 8 }}>RESUMEN RÁPIDO</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Propiedades', value: properties.length },
                { label: 'Rifas', value: raffles.length },
                { label: 'Anfitriones', value: hosts.length },
                { label: 'Usuarios', value: users.length },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#6B7280' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: '#111' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, padding: '24px 24px 48px', minWidth: 0 }}>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>Panel de administrador</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>{adminUser?.email}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                <StatCard label="Propiedades totales" value={properties.length} icon="🏠" sub={`${pendingProps.length} en revisión`} />
                <StatCard label="Rifas totales" value={raffles.length} icon="🎟️" sub={`${raffles.filter(r => r.status === 'active').length} activas`} />
                <StatCard label="Anfitriones" value={hosts.length} icon="🧑‍💼" sub={`${registrations.filter(r => r.status === 'pending').length} solicitudes`} />
                <StatCard label="Usuarios" value={users.length} icon="👥" sub="Total registrados" />
              </div>

              {(pendingProps.length > 0 || pendingRegs.length > 0) && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>⚠️ Acciones requeridas</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {pendingProps.length > 0 && (
                      <button onClick={() => setActiveTab('properties')} style={{ fontSize: 12, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>
                        🏠 {pendingProps.length} propiedad{pendingProps.length > 1 ? 'es' : ''} por aprobar
                      </button>
                    )}
                    {pendingRegs.length > 0 && (
                      <button onClick={() => setActiveTab('registrations')} style={{ fontSize: 12, color: '#991B1B', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>
                        📋 {pendingRegs.length} solicitud{pendingRegs.length > 1 ? 'es' : ''} de anfitrión
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
                  <SectionHeader title="Rifas recientes" count={raffles.slice(0, 5).length} />
                  <Table
                    cols={['Propiedad', 'Precio', 'Tickets', 'Estado', '']}
                    rows={raffles.slice(0, 5).map(r => [
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{r.properties?.name || '—'}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.properties?.city}</div>
                      </div>,
                      fmtMoney(r.ticket_price),
                      r.total_tickets,
                      <Badge status={r.status} />,
                      <Btn onClick={() => updateRaffleStatus(r.id, r.status === 'active' ? 'draft' : 'active')} disabled={actionLoading[r.id]}>
                        {r.status === 'active' ? 'Pausar' : 'Activar'}
                      </Btn>
                    ])}
                    empty="Sin rifas aún"
                  />
                </div>
                <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
                  <SectionHeader title="Propiedades recientes" count={properties.slice(0, 5).length} />
                  <Table
                    cols={['Nombre', 'Ciudad', 'Estado', '']}
                    rows={properties.slice(0, 5).map(p => [
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div>,
                      p.city || '—',
                      <Badge status={p.status} />,
                      p.status === 'pending_review' && (
                        <Btn onClick={() => updatePropertyStatus(p.id, 'approved')} variant="approve" disabled={actionLoading[p.id]}>
                          ✓ Aprobar
                        </Btn>
                      )
                    ])}
                    empty="Sin propiedades"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── PROPERTIES ── */}
          {activeTab === 'properties' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>🏠 Propiedades</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{properties.length} total · {pendingProps.length} en revisión</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
                <Table
                  cols={['Propiedad', 'Ubicación', 'Tipo', 'Estado', 'Fecha', 'Docs', 'Acciones']}
                  rows={properties.map(p => [
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</div>
                    </div>,
                    <div style={{ fontSize: 12 }}>
                      <div>{p.city}</div>
                      <div style={{ color: '#9CA3AF' }}>{p.state}</div>
                    </div>,
                    <span style={{ fontSize: 11, color: '#6B7280' }}>{p.property_type || '—'}</span>,
                    <Badge status={p.status} />,
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{fmt(p.created_at)}</span>,
                    <button onClick={() => setDocModal(p)} style={{
                      fontSize: 11, background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE',
                      borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600
                    }}>
                      📄 Ver docs
                    </button>,
                    <div style={{ display: 'flex', gap: 4 }}>
                      {p.status === 'pending_review' && <>
                        <Btn onClick={() => updatePropertyStatus(p.id, 'approved')} variant="approve" disabled={actionLoading[p.id]}>✓</Btn>
                        <Btn onClick={() => updatePropertyStatus(p.id, 'rejected')} variant="reject" disabled={actionLoading[p.id]}>✕</Btn>
                      </>}
                      {p.status === 'approved' && <Btn onClick={() => updatePropertyStatus(p.id, 'rejected')} variant="reject" disabled={actionLoading[p.id]}>Revocar</Btn>}
                      {p.status === 'rejected' && <Btn onClick={() => updatePropertyStatus(p.id, 'approved')} variant="approve" disabled={actionLoading[p.id]}>Restaurar</Btn>}
                    </div>
                  ])}
                  empty="Sin propiedades registradas"
                />
              </div>
            </div>
          )}

          {/* ── RAFFLES ── */}
          {activeTab === 'raffles' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>🎟️ Rifas</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{raffles.length} total · {raffles.filter(r => r.status === 'active').length} activas</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
                <Table
                  cols={['Propiedad', 'Precio boleto', 'Tickets', 'Vendidos', 'Estado', 'Fecha', 'Acciones']}
                  rows={raffles.map(r => [
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{r.properties?.name || r.property_id?.slice(0, 8)}</div>,
                    fmtMoney(r.ticket_price),
                    r.total_tickets,
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{(r.sold_tickets || []).length}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>{r.total_tickets > 0 ? Math.round(((r.sold_tickets || []).length / r.total_tickets) * 100) : 0}%</div>
                    </div>,
                    <Badge status={r.status} />,
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{fmt(r.created_at)}</span>,
                    <div style={{ display: 'flex', gap: 4 }}>
                      {r.status === 'draft' && <Btn onClick={() => updateRaffleStatus(r.id, 'active')} variant="approve" disabled={actionLoading[r.id]}>Activar</Btn>}
                      {r.status === 'active' && <Btn onClick={() => updateRaffleStatus(r.id, 'completed')} disabled={actionLoading[r.id]}>Completar</Btn>}
                      {(r.status === 'active' || r.status === 'draft') && <Btn onClick={() => updateRaffleStatus(r.id, 'cancelled')} variant="reject" disabled={actionLoading[r.id]}>Cancelar</Btn>}
                    </div>
                  ])}
                  empty="Sin rifas aún"
                />
              </div>
            </div>
          )}

          {/* ── HOSTS ── */}
          {activeTab === 'hosts' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>🧑‍💼 Anfitriones activos</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{hosts.length} anfitriones aprobados</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
                <Table
                  cols={['Anfitrión', 'Email', 'Propiedades', 'Registrado', 'Estado']}
                  rows={hosts.map(u => {
                    const userProps = properties.filter(p => p.host_id === u.id)
                    return [
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#6366F1' }}>
                          {(u.user_metadata?.full_name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>{u.user_metadata?.full_name || '—'}</div>
                        </div>
                      </div>,
                      <span style={{ fontSize: 12 }}>{u.email}</span>,
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{userProps.length}</span>,
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{fmt(u.created_at)}</span>,
                      <Badge status="host" />
                    ]
                  })}
                  empty="No hay anfitriones aprobados aún"
                />
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>👥 Todos los usuarios</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{users.length} registrados · {hosts.length} anfitriones · {users.length - hosts.length} viajeros</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
                {users.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
                    <div style={{ fontSize: 13 }}>Para ver usuarios necesitas el endpoint <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4 }}>/api/admin-users</code></div>
                  </div>
                ) : (
                  <Table
                    cols={['Usuario', 'Email', 'Rol', 'Registrado', 'Último acceso']}
                    rows={users.map(u => [
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: u.user_metadata?.role === 'host' ? '#EDE9FE' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: u.user_metadata?.role === 'host' ? '#7C3AED' : '#6B7280' }}>
                          {(u.email || '?')[0].toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{u.user_metadata?.full_name || u.email?.split('@')[0]}</div>
                      </div>,
                      <span style={{ fontSize: 12 }}>{u.email}</span>,
                      <Badge status={u.user_metadata?.role || 'guest'} />,
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{fmt(u.created_at)}</span>,
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{fmt(u.last_sign_in_at)}</span>,
                    ])}
                    empty="Sin usuarios"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── REGISTRATIONS ── */}
          {activeTab === 'registrations' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>📋 Solicitudes de anfitrión</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{registrations.length} total · {pendingRegs.length} pendientes</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
                <Table
                  cols={['Solicitante', 'Email', 'Estado', 'Fecha', 'Acciones']}
                  rows={registrations.map(r => [
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{r.full_name || '—'}</div>,
                    <span style={{ fontSize: 12 }}>{r.email}</span>,
                    <Badge status={r.status} />,
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{fmt(r.created_at)}</span>,
                    <div style={{ display: 'flex', gap: 4 }}>
                      {r.status === 'pending' && <>
                        <Btn onClick={() => handleRegistration(r, 'approve')} variant="approve" disabled={actionLoading[r.id]}>✓ Aprobar</Btn>
                        <Btn onClick={() => handleRegistration(r, 'reject')} variant="reject" disabled={actionLoading[r.id]}>✕ Rechazar</Btn>
                      </>}
                      {r.status !== 'pending' && <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>}
                    </div>
                  ])}
                  empty="Sin solicitudes de anfitrión"
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── DOC MODAL ── */}
      {docModal && <DocModal property={docModal} onClose={() => setDocModal(null)} />}

    </div>
  )
}
