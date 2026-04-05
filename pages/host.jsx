import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import ImageUploader from '../components/ImageUploader'
import { CURRENCIES } from '../lib/data'
import { supabase } from '../lib/supabase'

export default function HostPage({ lang, setLang }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [ticketPrice, setTicketPrice] = useState(5)
  const [totalTickets, setTotalTickets] = useState(300)
  const [minPct, setMinPct] = useState(50)
  const [currency, setCurrency] = useState('USD')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [user, setUser] = useState(null)
  const [myRaffles, setMyRaffles] = useState([])
  const [myProperties, setMyProperties] = useState([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [loadingRaffles, setLoadingRaffles] = useState(false)
  const [uploadedImages, setUploadedImages] = useState([])

  // Edit mode
  const [editingRaffle, setEditingRaffle] = useState(null) // raffle object being edited

  // Form fields
  const [propertyName, setPropertyName] = useState('')
  const [location, setLocation] = useState('San Carlos, Sonora, MX')
  const [stayDate, setStayDate] = useState('')
  const [checkoutDate, setCheckoutDate] = useState('')
  const [checkinTime, setCheckinTime] = useState('15:00')
  const [checkoutTime, setCheckoutTime] = useState('11:00')
  const [cleaningFee, setCleaningFee] = useState(0)
  const [drawDate, setDrawDate] = useState('')

  const gross = ticketPrice * totalTickets
  const comm = gross * 0.18
  const ins = gross * 0.05
  const net = gross - comm - ins + cleaningFee

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setUser(u)
      if (!u) router.push('/login')
      else loadMyProperties(u.id)
    })
  }, [])

  const loadMyProperties = async (uid) => {
    const { data } = await supabase
      .from('properties')
      .select('id, name, city, country, images')
      .eq('host_id', uid)
      .eq('status', 'approved')
    setMyProperties(data || [])
    loadMyRaffles(uid)
  }

  useEffect(() => {
    if (activeTab === 'raffles' && user) loadMyRaffles(user.id)
  }, [activeTab, user])

  const loadMyRaffles = async (uid) => {
    const hostId = uid || user?.id
    if (!hostId) return
    setLoadingRaffles(true)
    const { data } = await supabase
      .from('raffles')
      .select('*, properties(name, city, images)')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false })
    setMyRaffles(data || [])
    setLoadingRaffles(false)
  }

  const updateRaffleStatus = async (id, status) => {
    await supabase.from('raffles').update({ status }).eq('id', id)
    loadMyRaffles(user?.id)
  }

  const buildSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
    '-' + Date.now().toString().slice(-5)

  // Reglas de edición:
  // - Si tickets_sold === 0: puede editar todo
  // - Si tickets_sold > 0 y han pasado 24h desde created_at: puede editar fechas, precio y boletos
  // - Si tickets_sold > 0 y NO han pasado 24h: no puede editar nada (solo ver)
  const canEdit = (raffle) => {
    if (!raffle) return { allowed: false, priceAndTickets: false, datesOnly: false }
    const ticketsSold = raffle.tickets_sold || 0
    const hoursElapsed = (Date.now() - new Date(raffle.created_at)) / 3600000

    if (ticketsSold === 0) {
      return { allowed: true, priceAndTickets: true, datesOnly: false, reason: null }
    }
    if (hoursElapsed >= 24) {
      return {
        allowed: true,
        priceAndTickets: true,
        datesOnly: false,
        reason: lang === 'es'
          ? '⚠️ Ya hay boletos vendidos. El precio y boletos que pongas aplican solo a boletos futuros. Los compradores existentes conservan sus condiciones originales.'
          : '⚠️ Tickets already sold. Price/ticket changes only apply to future purchases. Existing buyers keep their original terms.'
      }
    }
    return {
      allowed: false,
      priceAndTickets: false,
      datesOnly: false,
      reason: lang === 'es'
        ? '🔒 No puedes editar esta rifa todavía. Debes esperar 24 horas desde que se publicó para poder hacer cambios.'
        : '🔒 You cannot edit this raffle yet. Wait 24 hours after publishing before making changes.'
    }
  }

  const handleEditRaffle = (raffle) => {
    const { allowed, reason } = canEdit(raffle)
    if (!allowed) {
      alert(reason)
      return
    }
    setEditingRaffle(raffle)
    setSelectedPropertyId(raffle.property_id)
    setTicketPrice(raffle.ticket_price)
    setTotalTickets(raffle.total_tickets)
    setCurrency(raffle.currency)
    setStayDate(raffle.stay_date || '')
    setCheckoutDate(raffle.checkout_date || '')
    setCheckinTime(raffle.checkin_time || '15:00')
    setCheckoutTime(raffle.checkout_time || '11:00')
    setCleaningFee(raffle.cleaning_fee || 0)
    setDrawDate(raffle.draw_date || '')
    setMinPct(raffle.min_tickets && raffle.total_tickets
      ? Math.round(raffle.min_tickets / raffle.total_tickets * 100)
      : 50)
    setSaveMsg(null)
    setActiveTab('new')
  }

  const resetForm = () => {
    setEditingRaffle(null)
    setSelectedPropertyId('')
    setTicketPrice(5)
    setTotalTickets(300)
    setCurrency('USD')
    setStayDate('')
    setCheckoutDate('')
    setCheckinTime('15:00')
    setCheckoutTime('11:00')
    setCleaningFee(0)
    setDrawDate('')
    setMinPct(50)
    setSaveMsg(null)
  }

  const saveRaffle = async (status = 'draft') => {
    if (!selectedPropertyId) { setSaveMsg({ type: 'error', text: lang === 'es' ? 'Selecciona una propiedad' : 'Select a property' }); return }
    if (status === 'active' && (!stayDate || !drawDate)) { setSaveMsg({ type: 'error', text: lang === 'es' ? 'Agrega las fechas del sorteo y estancia' : 'Add draw and stay dates' }); return }

    status === 'draft' ? setSaving(true) : setPublishing(true)
    setSaveMsg(null)

    const { data: { session: freshSession } } = await supabase.auth.getSession()
    const freshUserId = freshSession?.user?.id

    try {
      const payload = {
        property_id: selectedPropertyId,
        host_id: freshUserId,
        ticket_price: ticketPrice,
        currency,
        total_tickets: totalTickets,
        min_tickets: Math.round(totalTickets * minPct / 100),
        draw_date: drawDate || null,
        stay_date: stayDate || null,
        checkout_date: checkoutDate || null,
        checkin_time: checkinTime,
        checkout_time: checkoutTime,
        cleaning_fee: cleaningFee,
        status,
      }

      let raffleErr

      if (editingRaffle) {
        // UPDATE
        const { error } = await supabase
          .from('raffles')
          .update(payload)
          .eq('id', editingRaffle.id)
        raffleErr = error
      } else {
        // INSERT
        payload.slug = buildSlug(selectedPropertyId)
        const { error } = await supabase
          .from('raffles')
          .insert(payload)
          .select()
          .single()
        raffleErr = error
      }

      if (raffleErr) throw raffleErr

      setSaveMsg({
        type: 'success',
        text: editingRaffle
          ? (lang === 'es' ? '✅ Rifa actualizada correctamente' : '✅ Raffle updated successfully')
          : status === 'draft'
            ? (lang === 'es' ? '✅ Borrador guardado correctamente' : '✅ Draft saved successfully')
            : (lang === 'es' ? '🚀 ¡Rifa publicada! Ya está visible en la plataforma' : '🚀 Raffle published! Now live on the platform'),
      })

      setTimeout(() => {
        resetForm()
        setActiveTab('raffles')
        loadMyRaffles(freshUserId)
      }, 1500)

    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message })
    }

    setSaving(false)
    setPublishing(false)
  }

  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'new', icon: '➕', label: lang === 'es' ? 'Nueva rifa' : 'New raffle' },
    { id: 'raffles', icon: '🎟', label: lang === 'es' ? 'Mis rifas' : 'My raffles' },
    { id: 'earnings', icon: '💰', label: lang === 'es' ? 'Ganancias' : 'Earnings' },
    { id: 'account', icon: '👤', label: lang === 'es' ? 'Mi cuenta' : 'My account', href: '/dashboard' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
              {lang === 'es' ? 'Panel del anfitrión' : 'Host panel'}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Lucky Vacations Host · ✓ Verified</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => {
              if (t.id !== 'new') resetForm()
              setActiveTab(t.id)
            }} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', fontSize: 13, cursor: 'pointer',
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

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            {myProperties.length === 0 && (
              <div style={{ background: 'var(--brand-light)', border: '1px solid #9FE1CB', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand-dark)', marginBottom: 4 }}>
                    👋 {lang === 'es' ? '¡Bienvenido a Lucky Vaka!' : 'Welcome to Lucky Vaka!'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--brand-dark)', opacity: 0.8 }}>
                    {lang === 'es' ? 'El primer paso es registrar tu propiedad para poder crear rifas.' : 'First step is to register your property so you can create raffles.'}
                  </div>
                </div>
                <a href="/my-properties" className="btn-primary" style={{ flexShrink: 0, fontSize: 13, textDecoration: 'none' }}>
                  🏡 {lang === 'es' ? 'Registrar propiedad' : 'Register property'}
                </a>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: lang === 'es' ? 'Rifas activas' : 'Active raffles', val: myRaffles.filter(r => r.status === 'active').length, icon: '🎟' },
                { label: lang === 'es' ? 'Boletos vendidos' : 'Tickets sold', val: myRaffles.reduce((acc, r) => acc + (r.tickets_sold || 0), 0), icon: '🎫' },
                { label: lang === 'es' ? 'Propiedades' : 'Properties', val: myProperties.length, icon: '🏡' },
                { label: lang === 'es' ? 'Borradores' : 'Drafts', val: myRaffles.filter(r => r.status === 'draft').length, icon: '📝' },
              ].map((m, i) => (
                <div key={i} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--text)' }}>{m.val}</div>
                  <div style={{ fontSize: 18, marginTop: 4 }}>{m.icon}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
                  {lang === 'es' ? 'Rifas activas' : 'Active raffles'}
                </div>
                {myRaffles.filter(r => r.status === 'active').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🎟</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                      {lang === 'es' ? 'Aún no tienes rifas activas' : 'No active raffles yet'}
                    </div>
                    <button onClick={() => setActiveTab('new')} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                      + {lang === 'es' ? 'Crear rifa' : 'Create raffle'}
                    </button>
                  </div>
                ) : (
                  myRaffles.filter(r => r.status === 'active').map((r, i, arr) => {
                    const pct = r.total_tickets > 0 ? Math.round((r.tickets_sold || 0) / r.total_tickets * 100) : 0
                    return (
                      <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 44, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                          {r.properties?.images?.[0]
                            ? <img src={r.properties.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏡</div>
                          }
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{r.properties?.name}</div>
                          <div className="progress-bar" style={{ marginTop: 4 }}>
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 12 }}>
                          <div style={{ fontWeight: 600 }}>{pct}%</div>
                          <div style={{ color: 'var(--muted)', fontSize: 10 }}>{r.tickets_sold || 0}/{r.total_tickets}</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
                  {lang === 'es' ? 'Acciones rápidas' : 'Quick actions'}
                </div>
                {[
                  { icon: '🏡', label: lang === 'es' ? 'Registrar propiedad' : 'Register property', href: '/my-properties' },
                  { icon: '➕', label: lang === 'es' ? 'Crear nueva rifa' : 'Create new raffle', action: () => setActiveTab('new') },
                  { icon: '🎟', label: lang === 'es' ? 'Ver mis rifas' : 'View my raffles', action: () => setActiveTab('raffles') },
                ].map((item, i) => (
                  item.href ? (
                    <a key={i} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', fontSize: 13, color: 'var(--text)', textDecoration: 'none', cursor: 'pointer' }}>
                      <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
                      <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>→</span>
                    </a>
                  ) : (
                    <div key={i} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                      <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
                      <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>→</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NEW / EDIT RAFFLE */}
        {activeTab === 'new' && (
          <div style={{ maxWidth: 640 }}>

            {/* Edit mode header */}
            {editingRaffle && (
              <div style={{ background: '#E6F1FB', border: '1px solid #B3D4F5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#185FA5' }}>
                    ✏️ {lang === 'es' ? 'Editando rifa' : 'Editing raffle'}
                  </div>
                  <div style={{ fontSize: 11, color: '#185FA5', marginTop: 2 }}>
                    {editingRaffle.properties?.name} · {lang === 'es' ? 'Creada' : 'Created'}: {new Date(editingRaffle.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={resetForm} style={{ fontSize: 11, color: '#185FA5', background: 'transparent', border: '1px solid #B3D4F5', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                  {lang === 'es' ? 'Cancelar edición' : 'Cancel edit'}
                </button>
              </div>
            )}

            {/* Warning if tickets sold */}
            {editingRaffle && (editingRaffle.tickets_sold || 0) > 0 && (
              <div style={{ background: '#FAEEDA', border: '1px solid #F5C97A', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#633806' }}>
                {canEdit(editingRaffle).reason}
              </div>
            )}

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                {lang === 'es' ? 'Información de la propiedad' : 'Property information'}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  🏡 {lang === 'es' ? 'Selecciona tu propiedad' : 'Select your property'} *
                </label>
                {myProperties.length === 0 ? (
                  <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#633806' }}>
                    ⚠️ {lang === 'es' ? 'No tienes propiedades aprobadas. ' : 'No approved properties yet. '}
                    <a href="/my-properties" style={{ color: 'var(--brand)', fontWeight: 500 }}>
                      {lang === 'es' ? 'Registra una aquí →' : 'Register one here →'}
                    </a>
                  </div>
                ) : (
                  <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}
                    disabled={!!editingRaffle}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: editingRaffle ? 'var(--bg)' : 'var(--surface)', color: 'var(--text)', opacity: editingRaffle ? 0.6 : 1 }}>
                    <option value="">{lang === 'es' ? 'Selecciona una propiedad...' : 'Select a property...'}</option>
                    {myProperties.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.city}</option>
                    ))}
                  </select>
                )}
                {!editingRaffle && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    <a href="/my-properties" style={{ color: 'var(--brand)' }}>
                      + {lang === 'es' ? 'Administrar mis propiedades' : 'Manage my properties'}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                {lang === 'es' ? 'Configuración de la rifa' : 'Raffle configuration'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Ticket price *</label>
                  <input type="number" value={ticketPrice} onChange={e => setTicketPrice(+e.target.value)} min={1}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>Min 1 · Recommended 5–20</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    {lang === 'es' ? 'Moneda' : 'Currency'} *
                  </label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Total tickets *</label>
                  <input type="number" value={totalTickets} onChange={e => setTotalTickets(+e.target.value)} min={10}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>Min to activate: {Math.round(totalTickets * minPct / 100)} ({minPct}%)</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    🗓 {lang === 'es' ? 'Fecha de entrada (check-in)' : 'Check-in date'} *
                  </label>
                  <input type="date" value={stayDate} onChange={e => setStayDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    🗓 {lang === 'es' ? 'Fecha de salida (check-out)' : 'Check-out date'} *
                  </label>
                  <input type="date" value={checkoutDate} onChange={e => setCheckoutDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    🕒 {lang === 'es' ? 'Hora de entrada' : 'Check-in time'} *
                  </label>
                  <select value={checkinTime} onChange={e => setCheckinTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                    {['12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(t => (
                      <option key={t} value={t}>{t} hrs</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    🕙 {lang === 'es' ? 'Hora de salida' : 'Check-out time'} *
                  </label>
                  <select value={checkoutTime} onChange={e => setCheckoutTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                    {['09:00','10:00','11:00','12:00','13:00','14:00'].map(t => (
                      <option key={t} value={t}>{t} hrs</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  🧹 {lang === 'es' ? `Costo de limpieza (${currency})` : `Cleaning fee (${currency})`}
                </label>
                <input type="number" value={cleaningFee} onChange={e => setCleaningFee(+e.target.value)} min={0}
                  placeholder="0"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>
                  {lang === 'es'
                    ? 'Se suma al total que recibes. El ganador lo ve desglosado antes de aceptar.'
                    : 'Added to your payout. Winner sees it itemized before accepting.'}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  🎯 {lang === 'es' ? 'Fecha del sorteo' : 'Draw date'} *
                </label>
                <input type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>
                  {lang === 'es' ? 'Debe ser mínimo 7 días antes del check-in.' : 'Must be at least 7 days before check-in.'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Min % to activate: <strong>{minPct}%</strong>
                </label>
                <input type="range" min={30} max={100} step={5} value={minPct} onChange={e => setMinPct(+e.target.value)}
                  style={{ width: '100%' }} />
              </div>
            </div>

            {/* Payout calculator */}
            <div style={{ background: 'var(--brand-light)', border: '1px solid #9FE1CB', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-dark)', marginBottom: 10 }}>
                💰 {lang === 'es' ? 'Estimado de pago (si se venden todos)' : 'Estimated payout (if fully sold)'}
              </div>
              {[
                [lang === 'es' ? 'Venta total de boletos' : 'Gross ticket sales', `${gross.toFixed(2)} ${currency}`],
                ['Platform commission (18%)', `-${comm.toFixed(2)} ${currency}`],
                ['Insurance & ops (5%)', `-${ins.toFixed(2)} ${currency}`],
                ...(cleaningFee > 0 ? [[lang === 'es' ? 'Costo de limpieza' : 'Cleaning fee', `+${cleaningFee.toFixed(2)} ${currency}`]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--brand-dark)', marginBottom: 4 }}><span>{k}</span><span>{v}</span></div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: 'var(--brand-dark)', borderTop: '1px solid #9FE1CB', paddingTop: 8, marginTop: 4 }}>
                <span>{lang === 'es' ? 'Tú recibes' : 'You receive'}</span><span>{net.toFixed(2)} {currency}</span>
              </div>
            </div>

            <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#633806', marginBottom: 16 }}>
              ⚠️ {lang === 'es' ? 'El pago se libera solo después de que el ganador completa su estancia.' : 'Payment released only after winner completes their stay. Funds held in escrow.'}
            </div>

            {saveMsg && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14,
                background: saveMsg.type === 'success' ? 'var(--brand-light)' : '#FCEBEB',
                color: saveMsg.type === 'success' ? 'var(--brand-dark)' : '#A32D2D',
                border: `1px solid ${saveMsg.type === 'success' ? '#9FE1CB' : '#F7C1C1'}`,
              }}>
                {saveMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              {editingRaffle ? (
                <>
                  <button onClick={resetForm} className="btn-secondary">
                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button onClick={() => saveRaffle(editingRaffle.status)} className="btn-primary" disabled={saving}>
                    {saving ? '⏳ ' + (lang === 'es' ? 'Guardando...' : 'Saving...') : '💾 ' + (lang === 'es' ? 'Guardar cambios' : 'Save changes')}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => saveRaffle('draft')} className="btn-secondary" disabled={saving}>
                    {saving ? '⏳ ' + (lang === 'es' ? 'Guardando...' : 'Saving...') : '💾 ' + (lang === 'es' ? 'Guardar borrador' : 'Save draft')}
                  </button>
                  <button onClick={() => saveRaffle('active')} className="btn-primary" disabled={publishing}>
                    {publishing ? '⏳ ' + (lang === 'es' ? 'Publicando...' : 'Publishing...') : '🚀 ' + (lang === 'es' ? 'Publicar rifa' : 'Publish raffle')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* MY RAFFLES */}
        {activeTab === 'raffles' && (
          <div>
            <div className="card">
              {loadingRaffles ? (
                <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--muted)' }}>
                  ⏳ {lang === 'es' ? 'Cargando tus rifas...' : 'Loading your raffles...'}
                </div>
              ) : myRaffles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🎟</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                    {lang === 'es' ? 'Aún no tienes rifas' : 'No raffles yet'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
                    {lang === 'es' ? 'Crea tu primera rifa y empieza a ganar.' : 'Create your first raffle and start earning.'}
                  </div>
                  <button onClick={() => setActiveTab('new')} className="btn-primary">
                    + {lang === 'es' ? 'Crear primera rifa' : 'Create first raffle'}
                  </button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {[
                        lang === 'es' ? 'Propiedad' : 'Property',
                        'Status',
                        lang === 'es' ? 'Boletos' : 'Tickets',
                        lang === 'es' ? 'Sorteo' : 'Draw date',
                        lang === 'es' ? 'Pago est.' : 'Est. payout',
                        ''
                      ].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myRaffles.map(r => {
                      const gross = r.ticket_price * r.total_tickets
                      const net = gross * 0.77
                      const pct = r.total_tickets > 0 ? Math.round(r.tickets_sold / r.total_tickets * 100) : 0
                      const statusMap = {
                        active:    { bg: 'var(--brand-light)', color: 'var(--brand-dark)', label: '● Active' },
                        draft:     { bg: '#F4F3EF', color: 'var(--muted)', label: '✏️ Draft' },
                        completed: { bg: '#E6F1FB', color: '#185FA5', label: '✓ Done' },
                        cancelled: { bg: '#FCEBEB', color: '#A32D2D', label: '✗ Cancelled' },
                      }
                      const s = statusMap[r.status] || statusMap.draft
                      const editInfo = canEdit(r)
                      const hoursElapsed = (Date.now() - new Date(r.created_at)) / 3600000
                      const canEditNow = editInfo.allowed
                      const waitHours = Math.max(0, 24 - hoursElapsed).toFixed(1)

                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 500 }}>
                            {r.properties?.name || '—'}
                            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{r.properties?.city}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color }}>
                              {s.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div>{r.tickets_sold}/{r.total_tickets}</div>
                            <div className="progress-bar" style={{ width: 80, marginTop: 3 }}>
                              <div className="progress-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--muted)' }}>
                            {r.draw_date || '—'}
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--brand)', fontWeight: 500 }}>
                            ~{net.toFixed(0)} {r.currency}
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-start' }}>
                              {r.status === 'draft' && (
                                <button onClick={() => updateRaffleStatus(r.id, 'active')}
                                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--brand)', background: 'var(--brand-light)', color: 'var(--brand-dark)', cursor: 'pointer' }}>
                                  {lang === 'es' ? 'Activar' : 'Activate'}
                                </button>
                              )}
                              {r.status === 'active' && (
                                <button onClick={() => updateRaffleStatus(r.id, 'draft')}
                                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--muted)' }}>
                                  {lang === 'es' ? 'Pausar' : 'Pause'}
                                </button>
                              )}
                              {/* Edit button with 24h rule */}
                              {r.status !== 'completed' && r.status !== 'cancelled' && (
                                canEditNow ? (
                                  <button onClick={() => handleEditRaffle(r)}
                                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text)' }}>
                                    ✏️ {lang === 'es' ? 'Editar' : 'Edit'}
                                  </button>
                                ) : (
                                  <span style={{ fontSize: 10, color: 'var(--muted)' }} title={editInfo.reason}>
                                    🔒 {lang === 'es' ? `Disponible en ${waitHours}h` : `Available in ${waitHours}h`}
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <button onClick={() => { resetForm(); setActiveTab('new') }} className="btn-primary" style={{ marginTop: 16 }}>
              + {lang === 'es' ? 'Crear nueva rifa' : 'Create new raffle'}
            </button>
          </div>
        )}

        {/* EARNINGS */}
        {activeTab === 'earnings' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Total paid out', val: '$2,310', sub: '2 completed draws' },
                { label: 'Pending (escrow)', val: '$3,850', sub: 'Released after stays' },
                { label: 'Next payout', val: 'Apr 16', sub: 'Tucson draw' },
              ].map((m, i) => (
                <div key={i} className="card">
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>{m.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{m.sub}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Payout history</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Property', 'Draw', 'Gross', 'Commission', 'Net', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { prop: 'Beach House — San Carlos', draw: 'Feb 10', gross: '$1,500', comm: '-$345', net: '$1,155', paid: true },
                    { prop: 'Beach House — San Carlos', draw: 'Dec 05', gross: '$1,500', comm: '-$345', net: '$1,155', paid: true },
                    { prop: 'Modern Home — Tucson', draw: 'Apr 15', gross: '$4,000', comm: '-$920', net: '$2,695 est.', paid: false },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 8px' }}>{r.prop}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--muted)' }}>{r.draw}</td>
                      <td style={{ padding: '10px 8px' }}>{r.gross}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--muted)' }}>{r.comm}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{r.net}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: r.paid ? 'var(--brand-light)' : '#F4F3EF', color: r.paid ? 'var(--brand-dark)' : 'var(--muted)' }}>
                          {r.paid ? '✓ paid' : 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Total lifetime earnings</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>$5,005 USD</div>
              </div>
              <button className="btn-primary">Request payout</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
