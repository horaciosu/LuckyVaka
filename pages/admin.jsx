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
    if (url.includes('/object/public/host-documents/')) {
      const path = url.split('/object/public/host-documents/')[1]
      getSignedUrl(path)
      return
    }
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

// ─── MINI BAR CHART ──────────────────────────────────────────────────────────
const MiniBar = ({ data, maxVal, color = '#6366F1' }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
    {data.map((d, i) => (
      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <div style={{
          width: '100%', borderRadius: '3px 3px 0 0',
          background: i === data.length - 1 ? color : color + '60',
          height: maxVal > 0 ? `${(d.val / maxVal) * 36}px` : '2px',
          minHeight: 2, transition: 'height 0.3s ease'
        }} />
        <div style={{ fontSize: 9, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{d.label}</div>
      </div>
    ))}
  </div>
)

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Admin({ lang, setLang }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [properties, setProperties] = useState([])
  const [raffles, setRaffles] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [users, setUsers] = useState([])
  const [hosts, setHosts] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [docModal, setDocModal] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const [earningsPeriod, setEarningsPeriod] = useState('all')
  const [tickets, setTickets] = useState([])
  const [ticketFilter, setTicketFilter] = useState('all') // all | open | in_progress | resolved // 'all' | '30' | '7'

  useEffect(() => { checkAdmin() }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const role = user.user_metadata?.role
    if (role !== 'admin') { router.push('/'); return }
    setAdminUser(user)
    const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
    fetchAll(user)
  }

  const fetchAll = async (currentUser) => {
    setLoading(true)
    const [propsRes, rafflesRes, regsRes, purchasesRes] = await Promise.all([
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('raffles').select('*, properties(name, city, host_id)').order('created_at', { ascending: false }),
      supabase.from('host_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('purchases').select('*, raffles(id, slug, ticket_price, currency, status, host_id, properties(name, city))').order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
    ])
    setProperties(propsRes.data || [])
    setRaffles(rafflesRes.data || [])
    setRegistrations(regsRes.data || [])
    // tickets viene en el índice 3 (o 4 si hay purchases)
    const ticketsRes = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false })
    setTickets(ticketsRes.data || [])
    setPurchases(purchasesRes.data || [])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        const refreshToken = refreshed?.session?.access_token
        if (!refreshToken) { setLoading(false); return }
        const res = await fetch('/api/admin-users', { headers: { Authorization: 'Bearer ' + refreshToken } })
        if (res.ok) {
          const data = await res.json()
          const allUsers = data.users || []
          setUsers(allUsers)
          setHosts(allUsers.filter(u => u.user_metadata?.role === 'host'))
        }
      } else {
        const res = await fetch('/api/admin-users', { headers: { Authorization: 'Bearer ' + token } })
        if (res.ok) {
          const data = await res.json()
          const allUsers = data.users || []
          setUsers(allUsers)
          setHosts(allUsers.filter(u => u.user_metadata?.role === 'host'))
        }
      }
    } catch(e) { console.error('admin-users error:', e) }

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

  const updateTicketStatus = async (id, status, notes) => {
    setAction(id, true)
    const update = { status, updated_at: new Date().toISOString() }
    if (notes !== undefined) update.admin_notes = notes
    await supabase.from('support_tickets').update(update).eq('id', id)
    setTickets(t => t.map(x => x.id === id ? { ...x, ...update } : x))
    setAction(id, false)
  }

  const fmt = (date) => date ? new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'
  const fmtMoney = (n, currency = 'MXN') => n ? `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0 })} ${currency}` : '—'

  // ── CÁLCULOS DE GANANCIAS ────────────────────────────────────────────────
  const PLATFORM_COMMISSION = 0.20 // 20% comisión LuckyVaka

  const filterByPeriod = (items, days) => {
    if (days === 'all') return items
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - Number(days))
    return items.filter(p => new Date(p.created_at) >= cutoff)
  }

  const filteredPurchases = filterByPeriod(purchases, earningsPeriod)

  // Solo compras de rifas completadas o activas (no canceladas)
  const validPurchases = filteredPurchases.filter(p =>
    p.raffles?.status === 'completed' || p.raffles?.status === 'active'
  )

  const totalRevenue = validPurchases.reduce((sum, p) => sum + Number(p.total_paid || 0), 0)
  const platformEarnings = totalRevenue * PLATFORM_COMMISSION
  const hostEarnings = totalRevenue - platformEarnings
  const totalTransactions = validPurchases.length

  // Top rifas por ingresos
  const raffleRevenue = {}
  validPurchases.forEach(p => {
    const key = p.raffle_id
    if (!raffleRevenue[key]) {
      raffleRevenue[key] = {
        id: key,
        name: p.raffles?.properties?.name || p.raffle_slug || key?.slice(0, 8),
        city: p.raffles?.properties?.city || '—',
        status: p.raffles?.status,
        currency: p.raffles?.currency || 'MXN',
        total: 0,
        qty: 0,
        transactions: 0,
      }
    }
    raffleRevenue[key].total += Number(p.total_paid || 0)
    raffleRevenue[key].qty += p.qty || 0
    raffleRevenue[key].transactions += 1
  })
  const topRaffles = Object.values(raffleRevenue).sort((a, b) => b.total - a.total)

  // Ingresos por mes (últimos 6 meses)
  const monthlyData = (() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      months.push({
        label: d.toLocaleDateString('es-MX', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        val: 0,
      })
    }
    purchases.forEach(p => {
      const d = new Date(p.created_at)
      const m = months.find(mo => mo.month === d.getMonth() && mo.year === d.getFullYear())
      if (m) m.val += Number(p.total_paid || 0)
    })
    return months
  })()
  const maxMonthVal = Math.max(...monthlyData.map(m => m.val), 1)

  // Ingresos por anfitrión
  const hostRevenue = {}
  validPurchases.forEach(p => {
    const hostId = p.raffles?.host_id
    if (!hostId) return
    if (!hostRevenue[hostId]) {
      hostRevenue[hostId] = { hostId, total: 0, transactions: 0, raffles: new Set() }
    }
    hostRevenue[hostId].total += Number(p.total_paid || 0)
    hostRevenue[hostId].transactions += 1
    hostRevenue[hostId].raffles.add(p.raffle_id)
  })
  const topHosts = Object.values(hostRevenue)
    .map(h => ({ ...h, raffleCount: h.raffles.size }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const TABS = [
    { id: 'overview',      icon: '📊', label: 'Resumen' },
    { id: 'properties',    icon: '🏠', label: 'Propiedades' },
    { id: 'raffles',       icon: '🎟️', label: 'Rifas' },
    { id: 'hosts',         icon: '🧑‍💼', label: 'Anfitriones' },
    { id: 'users',         icon: '👥', label: 'Usuarios' },
    { id: 'registrations', icon: '📋', label: 'Registros' },
    { id: 'draws', icon: '🎯', label: 'Sorteos' },
    { id: 'support', icon: '🎧', label: 'Soporte' },
    { id: 'earnings',      icon: '💰', label: 'Ganancias' },
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
          <button onClick={signOut} style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#991B1B' }}>
            🚪 Cerrar sesión
          </button>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366F1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700 }}>
            {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : adminUser?.email?.[0]?.toUpperCase()}
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
                <StatCard label="Ingresos totales" value={`$${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`} icon="💰" sub={`${purchases.length} transacciones`} />
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

              {/* ── MÉTRICAS DE CONVERSIÓN ── */}
              {raffles.length > 0 && (() => {
                const activeRaffles = raffles.filter(r => r.status === 'active')
                const completedRaffles = raffles.filter(r => r.status === 'completed')
                const cancelledRaffles = raffles.filter(r => r.status === 'cancelled')
                const draftRaffles = raffles.filter(r => r.status === 'draft')

                // Tasa de activación: rifas que llegaron a active o completed vs total
                const activatedCount = raffles.filter(r => ['active','completed'].includes(r.status)).length
                const activationRate = raffles.length > 0 ? Math.round((activatedCount / raffles.length) * 100) : 0

                // Tasa de llenado promedio (tickets vendidos / total)
                const fillRates = raffles
                  .filter(r => r.total_tickets > 0)
                  .map(r => ((r.tickets_sold || (r.sold_tickets || []).length || 0) / r.total_tickets) * 100)
                const avgFillRate = fillRates.length > 0 ? Math.round(fillRates.reduce((a,b) => a+b, 0) / fillRates.length) : 0

                // Rifas con problema (canceladas o sin activar)
                const problemRaffles = cancelledRaffles.length + draftRaffles.length

                // Ingresos por rifa activa
                const revenuePerRaffle = activeRaffles.length > 0 ? Math.round(totalRevenue / Math.max(completedRaffles.length + activeRaffles.length, 1)) : 0

                const metrics = [
                  {
                    label: 'Tasa de activación',
                    value: activationRate + '%',
                    sub: `${activatedCount} de ${raffles.length} rifas activadas`,
                    color: activationRate >= 70 ? '#059669' : activationRate >= 40 ? '#D97706' : '#DC2626',
                    bg: activationRate >= 70 ? '#D1FAE5' : activationRate >= 40 ? '#FEF3C7' : '#FEE2E2',
                    pct: activationRate,
                  },
                  {
                    label: 'Llenado promedio',
                    value: avgFillRate + '%',
                    sub: `Promedio de boletos vendidos`,
                    color: avgFillRate >= 70 ? '#059669' : avgFillRate >= 40 ? '#D97706' : '#DC2626',
                    bg: avgFillRate >= 70 ? '#D1FAE5' : avgFillRate >= 40 ? '#FEF3C7' : '#FEE2E2',
                    pct: avgFillRate,
                  },
                  {
                    label: 'Rifas completadas',
                    value: completedRaffles.length,
                    sub: `${activeRaffles.length} activas · ${cancelledRaffles.length} canceladas`,
                    color: '#6366F1',
                    bg: '#EEF2FF',
                    pct: raffles.length > 0 ? Math.round((completedRaffles.length / raffles.length) * 100) : 0,
                  },
                  {
                    label: 'Ingreso por rifa',
                    value: '$' + revenuePerRaffle.toLocaleString('es-MX'),
                    sub: `Promedio rifas activas/completadas`,
                    color: '#059669',
                    bg: '#D1FAE5',
                    pct: null,
                  },
                ]

                return (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 12 }}>📈 Métricas de conversión</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {metrics.map((m, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #F3F4F6' }}>
                          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 4 }}>{m.value}</div>
                          {m.pct !== null && (
                            <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                              <div style={{ height: '100%', width: Math.min(m.pct, 100) + '%', background: m.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>{m.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Rifas problemáticas */}
                    {(cancelledRaffles.length > 0 || draftRaffles.filter(r => {
                      const created = new Date(r.created_at)
                      const days = (new Date() - created) / 86400000
                      return days > 7
                    }).length > 0) && (
                      <div style={{ marginTop: 10, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 16 }}>⚠️</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>Rifas que requieren atención</div>
                          <div style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>
                            {cancelledRaffles.length > 0 && `${cancelledRaffles.length} cancelada${cancelledRaffles.length > 1 ? 's' : ''}`}
                            {cancelledRaffles.length > 0 && draftRaffles.length > 0 && ' · '}
                            {draftRaffles.length > 0 && `${draftRaffles.length} en borrador sin activar`}
                          </div>
                        </div>
                        <button onClick={() => setActiveTab('raffles')} style={{ fontSize: 11, fontWeight: 700, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                          Ver rifas →
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}

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

          {/* ══════════════════════════════════════════════
              ── GANANCIAS ──
          ══════════════════════════════════════════════ */}
          {activeTab === 'earnings' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>💰 Ganancias</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                    Ingresos totales · Comisión LuckyVaka (20%) · Pago a anfitriones
                  </div>
                </div>
                {/* Filtro de período */}
                <div style={{ display: 'flex', gap: 6, background: '#F3F4F6', borderRadius: 10, padding: 4 }}>
                  {[{ id: '7', label: '7 días' }, { id: '30', label: '30 días' }, { id: 'all', label: 'Todo' }].map(p => (
                    <button key={p.id} onClick={() => setEarningsPeriod(p.id)} style={{
                      padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: earningsPeriod === p.id ? '#fff' : 'transparent',
                      color: earningsPeriod === p.id ? '#111' : '#9CA3AF',
                      boxShadow: earningsPeriod === p.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s'
                    }}>{p.label}</button>
                  ))}
                </div>
              </div>

              {/* KPIs principales */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Ingreso total', val: fmtMoney(totalRevenue), icon: '💵', sub: `${totalTransactions} transacciones`, color: '#6366F1', bg: '#EEF2FF' },
                  { label: 'Comisión LuckyVaka (20%)', val: fmtMoney(platformEarnings), icon: '⭐', sub: 'Tu ganancia neta', color: '#059669', bg: '#D1FAE5' },
                  { label: 'Pago a anfitriones (80%)', val: fmtMoney(hostEarnings), icon: '🏠', sub: `${topHosts.length} anfitriones activos`, color: '#7C3AED', bg: '#EDE9FE' },
                  { label: 'Ticket promedio', val: totalTransactions > 0 ? fmtMoney(totalRevenue / totalTransactions) : '—', icon: '🎟', sub: 'Por transacción', color: '#D97706', bg: '#FEF3C7' },
                ].map((k, i) => (
                  <div key={i} style={{
                    background: '#fff', borderRadius: 14, padding: '18px 20px',
                    border: `1px solid ${k.bg}`,
                    borderLeft: `4px solid ${k.color}`,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</div>
                      <div style={{ fontSize: 18, lineHeight: 1 }}>{k.icon}</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: '-0.02em', marginBottom: 4 }}>{k.val}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Gráfica mensual + split visual */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

                {/* Gráfica de barras últimos 6 meses */}
                <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4 }}>Ingresos por mes</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>Últimos 6 meses · total bruto</div>
                  <MiniBar data={monthlyData} maxVal={maxMonthVal} color="#6366F1" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                      Mejor mes: <strong style={{ color: '#111' }}>
                        {monthlyData.reduce((best, m) => m.val > best.val ? m : best, monthlyData[0])?.label}
                      </strong>
                    </div>
                    <div style={{ fontSize: 11, color: '#6366F1', fontWeight: 700 }}>
                      {fmtMoney(monthlyData.reduce((s, m) => s + m.val, 0))} total
                    </div>
                  </div>
                </div>

                {/* Distribución del ingreso */}
                <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4 }}>Distribución del ingreso</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 20 }}>Cómo se divide cada peso recaudado</div>

                  {totalRevenue > 0 ? (
                    <>
                      {/* Barra de distribución visual */}
                      <div style={{ height: 28, borderRadius: 8, overflow: 'hidden', display: 'flex', marginBottom: 16 }}>
                        <div style={{ width: '20%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 10, color: '#fff', fontWeight: 800 }}>20%</span>
                        </div>
                        <div style={{ width: '80%', background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 10, color: '#fff', fontWeight: 800 }}>80%</span>
                        </div>
                      </div>
                      {[
                        { label: 'LuckyVaka (comisión)', pct: '20%', amount: platformEarnings, color: '#6366F1' },
                        { label: 'Anfitriones (pago)', pct: '80%', amount: hostEarnings, color: '#7C3AED' },
                      ].map(d => (
                        <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                            <span style={{ fontSize: 12, color: '#374151' }}>{d.label}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{fmtMoney(d.amount)}</div>
                            <div style={{ fontSize: 10, color: '#9CA3AF' }}>{d.pct}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>
                      Sin transacciones en este período
                    </div>
                  )}
                </div>
              </div>

              {/* Top rifas por ingresos */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6', marginBottom: 16 }}>
                <SectionHeader title="Top rifas por ingresos" count={topRaffles.length} />
                {topRaffles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 13 }}>
                    Sin datos de ventas en este período
                  </div>
                ) : (
                  <Table
                    cols={['Propiedad', 'Ubicación', 'Estado', 'Transacciones', 'Boletos', 'Ingreso total', 'LuckyVaka (20%)', 'Anfitrión (80%)']}
                    rows={topRaffles.map((r, i) => [
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', width: 16 }}>#{i + 1}</span>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{r.name}</div>
                      </div>,
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{r.city}</span>,
                      <Badge status={r.status} />,
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{r.transactions}</span>,
                      <span style={{ fontSize: 12 }}>{r.qty}</span>,
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{fmtMoney(r.total, r.currency)}</span>,
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{fmtMoney(r.total * PLATFORM_COMMISSION, r.currency)}</span>,
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>{fmtMoney(r.total * (1 - PLATFORM_COMMISSION), r.currency)}</span>,
                    ])}
                    empty="Sin rifas con ventas"
                  />
                )}
              </div>

              {/* Top anfitriones por ingresos generados */}
              {topHosts.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
                  <SectionHeader title="Anfitriones por volumen" count={topHosts.length} />
                  <Table
                    cols={['Anfitrión ID', 'Rifas', 'Transacciones', 'Volumen total', 'Su pago (80%)']}
                    rows={topHosts.map((h, i) => [
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', width: 16 }}>#{i + 1}</span>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>
                          {h.hostId.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace' }}>{h.hostId.slice(0, 8)}…</span>
                      </div>,
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{h.raffleCount}</span>,
                      <span style={{ fontSize: 12 }}>{h.transactions}</span>,
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{fmtMoney(h.total)}</span>,
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>{fmtMoney(h.total * 0.8)}</span>,
                    ])}
                    empty="Sin datos"
                  />
                </div>
              )}
            </div>
          )}


          {/* ══════════════════════════════════════════════
              ── SORTEOS ──
          ══════════════════════════════════════════════ */}
          {activeTab === 'draws' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>🎯 Sorteos</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                  Gestiona y ejecuta los sorteos de cada rifa
                </div>
              </div>

              {/* Rifas activas listas para sortear */}
              {raffles.filter(r => r.status === 'active').length > 0 && (
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#15803D', marginBottom: 4 }}>
                    🟢 {raffles.filter(r => r.status === 'active').length} rifa{raffles.filter(r => r.status === 'active').length > 1 ? 's' : ''} activa{raffles.filter(r => r.status === 'active').length > 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: '#16A34A' }}>
                    Puedes ejecutar el sorteo desde la página en vivo o usar el botón de cada rifa abajo.
                  </div>
                </div>
              )}

              {/* Todas las rifas con acciones de sorteo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {raffles.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: 14, padding: 40, border: '1px solid #F3F4F6', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    Sin rifas registradas aún
                  </div>
                ) : raffles.map(r => {
                  const drawUrl = '/draw/' + r.slug
                  const isActive = r.status === 'active'
                  const isCompleted = r.status === 'completed'
                  const isCancelled = r.status === 'cancelled'
                  const soldCount = (r.sold_tickets || []).length || r.tickets_sold || 0
                  const pct = r.total_tickets > 0 ? Math.round((soldCount / r.total_tickets) * 100) : 0
                  const drawDate = r.draw_date ? new Date(r.draw_date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

                  return (
                    <div key={r.id} style={{
                      background: '#fff', borderRadius: 14, padding: '20px 24px',
                      border: isCompleted ? '1px solid #86EFAC' : isActive ? '1px solid #6EE7B7' : '1px solid #F3F4F6',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
                              {r.properties?.name || r.slug}
                            </div>
                            <Badge status={r.status} />
                          </div>
                          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#6B7280', flexWrap: 'wrap' }}>
                            <span>📍 {r.properties?.city || '—'}</span>
                            <span>🎯 Sorteo: <strong style={{ color: '#374151' }}>{drawDate}</strong></span>
                            <span>🎟 {soldCount} / {r.total_tickets} boletos vendidos</span>
                            <span>💰 ${Number(r.ticket_price || 0).toLocaleString()} {r.currency || 'MXN'} c/u</span>
                          </div>

                          {/* Barra de progreso */}
                          <div style={{ marginTop: 10 }}>
                            <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: pct + '%', background: isCompleted ? '#10B981' : '#6366F1', borderRadius: 3, transition: 'width 0.3s' }} />
                            </div>
                            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3 }}>{pct}% vendido</div>
                          </div>

                          {/* Ganador si está completada */}
                          {isCompleted && r.winner_ticket && (
                            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '6px 12px' }}>
                              <span style={{ fontSize: 16 }}>🏆</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>
                                Ganador: Boleto #{r.winner_ticket}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Acciones */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end' }}>
                          {/* Ver página en vivo */}
                          <a href={drawUrl} target="_blank" rel="noopener noreferrer" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: isActive ? 'linear-gradient(135deg, #1A6B3C, #2E8B57)' : '#F3F4F6',
                            color: isActive ? '#fff' : '#6B7280',
                            textDecoration: 'none', border: 'none',
                            boxShadow: isActive ? '0 2px 8px rgba(26,107,60,0.25)' : 'none'
                          }}>
                            {isActive ? '🔴 Página en vivo' : '👁 Ver página'}
                          </a>

                          {/* Copiar link */}
                          <button onClick={() => {
                            navigator.clipboard.writeText('https://luckyvaka.com' + drawUrl)
                            alert('Link copiado: luckyvaka.com' + drawUrl)
                          }} style={{
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE', cursor: 'pointer'
                          }}>
                            🔗 Copiar link
                          </button>

                          {/* Cambiar estado */}
                          {!isCompleted && !isCancelled && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              {r.status === 'draft' && (
                                <Btn onClick={() => updateRaffleStatus(r.id, 'active')} variant="approve" disabled={actionLoading[r.id]}>
                                  Activar
                                </Btn>
                              )}
                              {r.status === 'active' && (
                                <Btn onClick={() => updateRaffleStatus(r.id, 'completed')} disabled={actionLoading[r.id]}>
                                  Completar
                                </Btn>
                              )}
                              <Btn onClick={() => updateRaffleStatus(r.id, 'cancelled')} variant="reject" disabled={actionLoading[r.id]}>
                                Cancelar
                              </Btn>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              ── SOPORTE ──
          ══════════════════════════════════════════════ */}
          {activeTab === 'support' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>🎧 Soporte</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                    {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} · {tickets.filter(t => t.status === 'open').length} abiertos
                  </div>
                </div>
                {/* Filtros */}
                <div style={{ display: 'flex', gap: 6, background: '#F3F4F6', borderRadius: 10, padding: 4 }}>
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'open', label: 'Abiertos' },
                    { id: 'in_progress', label: 'En proceso' },
                    { id: 'resolved', label: 'Resueltos' },
                  ].map(f => (
                    <button key={f.id} onClick={() => setTicketFilter(f.id)} style={{
                      padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: ticketFilter === f.id ? '#fff' : 'transparent',
                      color: ticketFilter === f.id ? '#111' : '#9CA3AF',
                      boxShadow: ticketFilter === f.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}>{f.label}</button>
                  ))}
                </div>
              </div>

              {/* Lista de tickets */}
              {tickets.filter(tk => ticketFilter === 'all' || tk.status === ticketFilter).length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 14, padding: 48, border: '1px solid #F3F4F6', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎧</div>
                  <div style={{ fontSize: 14, color: '#9CA3AF' }}>
                    {ticketFilter === 'all' ? 'Sin tickets de soporte aún' : `Sin tickets ${ticketFilter === 'open' ? 'abiertos' : ticketFilter === 'in_progress' ? 'en proceso' : 'resueltos'}`}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tickets
                    .filter(tk => ticketFilter === 'all' || tk.status === ticketFilter)
                    .map(tk => {
                      const TYPE_LABELS = {
                        host_cancelled: 'Anfitrión canceló',
                        wrong_dates: 'Fechas incorrectas',
                        property_mismatch: 'Propiedad no corresponde',
                        refund: 'Solicitud de reembolso',
                        other: 'Otro',
                      }
                      const STATUS_COLORS = {
                        open: { bg: '#FEE2E2', color: '#DC2626', label: 'Abierto' },
                        in_progress: { bg: '#FEF3C7', color: '#D97706', label: 'En proceso' },
                        resolved: { bg: '#D1FAE5', color: '#059669', label: 'Resuelto' },
                        closed: { bg: '#F3F4F6', color: '#6B7280', label: 'Cerrado' },
                      }
                      const sc = STATUS_COLORS[tk.status] || STATUS_COLORS.open

                      return (
                        <div key={tk.id} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color }}>{sc.label}</span>
                                <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '3px 8px', borderRadius: 6 }}>{TYPE_LABELS[tk.type] || tk.type}</span>
                              </div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4 }}>{tk.property_name || tk.raffle_slug}</div>
                              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                                👤 {tk.user_name || tk.user_email} · 📅 {fmt(tk.created_at)}
                              </div>
                              <div style={{ fontSize: 13, color: '#374151', background: '#F9FAFB', borderRadius: 8, padding: '10px 12px', lineHeight: 1.6 }}>
                                {tk.description}
                              </div>
                              {tk.admin_notes && (
                                <div style={{ marginTop: 8, fontSize: 12, color: '#6366F1', background: '#EEF2FF', borderRadius: 8, padding: '8px 12px' }}>
                                  📝 Nota interna: {tk.admin_notes}
                                </div>
                              )}
                            </div>
                            {/* Acciones */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                              {tk.status === 'open' && (
                                <Btn onClick={() => updateTicketStatus(tk.id, 'in_progress')} disabled={actionLoading[tk.id]}>
                                  En proceso
                                </Btn>
                              )}
                              {tk.status === 'in_progress' && (
                                <Btn onClick={() => updateTicketStatus(tk.id, 'resolved')} variant="approve" disabled={actionLoading[tk.id]}>
                                  ✓ Resolver
                                </Btn>
                              )}
                              {(tk.status === 'open' || tk.status === 'in_progress') && (
                                <Btn onClick={() => updateTicketStatus(tk.id, 'closed')} variant="reject" disabled={actionLoading[tk.id]}>
                                  Cerrar
                                </Btn>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )}


        </div>
      </div>

      {/* ── DOC MODAL ── */}
      {docModal && <DocModal property={docModal} onClose={() => setDocModal(null)} />}

    </div>
  )
}
