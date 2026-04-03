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

  useEffect(() => {
    if (activeTab === 'raffles' && user) loadMyRaffles()
  }, [activeTab, user])

  const loadMyProperties = async (uid) => {
    const { data } = await supabase.from('properties').select('id, name, city').eq('host_id', uid).eq('status', 'approved')
    setMyProperties(data || [])
    loadMyRaffles(uid)
  }

  const loadMyRaffles = async (uid) => {
    const hostId = uid || user?.id
    if (!hostId) return
    setLoadingRaffles(true)
    const { data } = await supabase.from('raffles').select('*, properties(name, city)').eq('host_id', hostId).order('created_at', { ascending: false })
    setMyRaffles(data || [])
    setLoadingRaffles(false)
  }

  const updateRaffleStatus = async (id, status) => {
    await supabase.from('raffles').update({ status }).eq('id', id)
    loadMyRaffles()
  }

  const buildSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-5)

  const saveRaffle = async (status = 'draft') => {
    if (!selectedPropertyId) { setSaveMsg({ type: 'error', text: lang === 'es' ? 'Selecciona una propiedad' : 'Select a property' }); return }
    if (status === 'active' && (!stayDate || !drawDate)) { setSaveMsg({ type: 'error', text: lang === 'es' ? 'Agrega fechas' : 'Add dates' }); return }
    status === 'draft' ? setSaving(true) : setPublishing(true)
    setSaveMsg(null)
    try {
      const { data: raffle, error } = await supabase.from('raffles').insert({
        property_id: selectedPropertyId, host_id: user.id, slug: buildSlug(selectedPropertyId),
        ticket_price: ticketPrice, currency, total_tickets: totalTickets, min_pct: minPct,
        stay_date: stayDate, checkout_date: checkoutDate, checkin_time: checkinTime,
        checkout_time: checkoutTime, cleaning_fee: cleaningFee, draw_date: drawDate, status,
      }).select().single()
      if (error) throw error
      if (uploadedImages.length > 0) {
        await supabase.from('raffle_images').insert(uploadedImages.map((url, i) => ({ raffle_id: raffle.id, url, position: i })))
      }
      setSaveMsg({ type: 'success', text: lang === 'es' ? 'Rifa guardada' : 'Raffle saved' })
      setTimeout(() => loadMyRaffles(), 1500)
    } catch (err) { setSaveMsg({ type: 'error', text: err.message }) }
    setSaving(false)
    setPublishing(false)
  }

  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'new', icon: '➕', label: lang === 'es' ? 'Nueva rifa' : 'New raffle' },
    { id: 'raffles', icon: '🎫', label: lang === 'es' ? 'Mis rifas' : 'My raffles' },
    { id: 'earnings', icon: '💰', label: lang === 'es' ? 'Ganancias' : 'Earnings' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            {lang === 'es' ? 'Panel del anfitrion' : 'Host panel'}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Lucky Vacations Host</div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer',
              background: 'transparent', border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
              color: activeTab === t.id ? 'var(--brand)' : 'var(--muted)',
              fontWeight: activeTab === t.id ? 500 : 400, marginBottom: -1,
            }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div style={{ maxWidth: 640 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                {lang === 'es' ? 'Resumen' : 'Summary'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { n: myRaffles.length, label: lang === 'es' ? 'Rifas totales' : 'Total raffles' },
                  { n: myRaffles.filter(r => r.status === 'active').length, label: lang === 'es' ? 'Activas' : 'Active' },
                  { n: myProperties.length, label: lang === 'es' ? 'Propiedades' : 'Properties' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--surface)', borderRadius: 8 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand)' }}>{s.n}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
                {lang === 'es' ? 'Acciones rapidas' : 'Quick actions'}
              </div>
              <a href="/my-properties" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', textDecoration: 'none' }}>
                <span style={{ fontSize: 18 }}>🏠</span>
                {lang === 'es' ? 'Registrar propiedad' : 'Register property'}
                <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{'>'}</span>
              </a>
              <div onClick={() => setActiveTab('new')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                <span style={{ fontSize: 18 }}>➕</span>
                {lang === 'es' ? 'Crear nueva rifa' : 'Create new raffle'}
                <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{'>'}</span>
              </div>
              <div onClick={() => setActiveTab('raffles')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                <span style={{ fontSize: 18 }}>🎫</span>
                {lang === 'es' ? 'Ver mis rifas' : 'View my raffles'}
                <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{'>'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'new' && (
          <div style={{ maxWidth: 640 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                {lang === 'es' ? 'Informacion de la propiedad' : 'Property information'}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  {lang === 'es' ? 'Selecciona tu propiedad' : 'Select your property'}
                </label>
                {myProperties.length === 0 ? (
                  <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#633806' }}>
                    {lang === 'es' ? 'No tienes propiedades aprobadas. ' : 'No approved properties yet. '}
                    <a href="/my-properties" style={{ color: 'var(--brand)', fontWeight: 500 }}>
                      {lang === 'es' ? 'Registra una aqui' : 'Register one here'}
                    </a>
                  </div>
                ) : (
                  <select value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                    <option value="">{lang === 'es' ? 'Selecciona una propiedad...' : 'Select a property...'}</option>
                    {myProperties.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.city}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                {lang === 'es' ? 'Configuracion de la rifa' : 'Raffle configuration'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Ticket price</label>
                  <input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(+e.target.value)} min={1} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{lang === 'es' ? 'Moneda' : 'Currency'}</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Total tickets</label>
                  <input type="number" value={totalTickets} onChange={(e) => setTotalTickets(+e.target.value)} min={10} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{lang === 'es' ? 'Fecha de entrada' : 'Check-in date'}</label>
                  <input type="date" value={stayDate} onChange={(e) => setStayDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{lang === 'es' ? 'Fecha de salida' : 'Check-out date'}</label>
                  <input type="date" value={checkoutDate} onChange={(e) => setCheckoutDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{lang === 'es' ? 'Hora de entrada' : 'Check-in time'}</label>
                  <select value={checkinTime} onChange={(e) => setCheckinTime(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                    {['12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(t => (
                      <option key={t} value={t}>{t} hrs</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{lang === 'es' ? 'Hora de salida' : 'Check-out time'}</label>
                  <select value={checkoutTime} onChange={(e) => setCheckoutTime(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                    {['09:00','10:00','11:00','12:00','13:00','14:00'].map(t => (
                      <option key={t} value={t}>{t} hrs</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{lang === 'es' ? 'Costo de limpieza' : 'Cleaning fee'} ({currency})</label>
                <input type="number" value={cleaningFee} onChange={(e) => setCleaningFee(+e.target.value)} min={0} placeholder="0" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{lang === 'es' ? 'Fecha del sorteo' : 'Draw date'}</label>
                <input type="date" value={drawDate} onChange={(e) => setDrawDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Min % to activate: <strong>{minPct}%</strong></label>
                <input type="range" min={30} max={100} step={5} value={minPct} onChange={(e) => setMinPct(+e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                {lang === 'es' ? 'Fotos de la rifa' : 'Raffle photos'}
              </div>
              <ImageUploader onUpload={setUploadedImages} />
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                {lang === 'es' ? 'Vista previa de ganancias' : 'Earnings preview'}
              </div>
              {[
                { label: lang === 'es' ? 'Venta total' : 'Gross sales', value: gross.toFixed(2) + ' ' + currency },
                { label: 'Commission (18%)', value: '-' + comm.toFixed(2) + ' ' + currency },
                { label: 'Insurance (5%)', value: '-' + ins.toFixed(2) + ' ' + currency },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, padding: '10px 0', color: 'var(--brand)' }}>
                <span>{lang === 'es' ? 'Tu ganancia estimada' : 'Your estimated payout'}</span>
                <span>{net.toFixed(2)} {currency}</span>
              </div>
            </div>

            {saveMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13, background: saveMsg.type === 'success' ? '#9FE1CB' : '#F7C1C1', color: saveMsg.type === 'success' ? '#1a4a38' : '#7a1a1a' }}>
                {saveMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => saveRaffle('draft')} disabled={saving} className="btn-secondary" style={{ flex: 1 }}>
                {saving ? '...' : (lang === 'es' ? 'Guardar borrador' : 'Save draft')}
              </button>
              <button onClick={() => saveRaffle('active')} disabled={publishing} className="btn-primary" style={{ flex: 2 }}>
                {publishing ? '...' : (lang === 'es' ? 'Publicar rifa' : 'Publish raffle')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'raffles' && (
          <div>
            {loadingRaffles ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                {lang === 'es' ? 'Cargando...' : 'Loading...'}
              </div>
            ) : myRaffles.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎫</div>
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>{lang === 'es' ? 'No tienes rifas aun.' : 'No raffles yet.'}</div>
                <button onClick={() => setActiveTab('new')} className="btn-primary" style={{ marginTop: 16 }}>
                  {lang === 'es' ? 'Crear primera rifa' : 'Create first raffle'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {myRaffles.map((r) => (
                  <div key={r.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                          {r.properties?.name} - {r.properties?.city}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {r.ticket_price} {r.currency} / ticket
                        </div>
                      </div>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, fontWeight: 500, background: r.status === 'active' ? 'var(--brand-light)' : '#F4F3EF', color: r.status === 'active' ? 'var(--brand-dark)' : 'var(--muted)' }}>
                        {r.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      {r.status === 'draft' && (
                        <button onClick={() => updateRaffleStatus(r.id, 'active')} className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                          {lang === 'es' ? 'Publicar' : 'Publish'}
                        </button>
                      )}
                      <a href={'/raffle/' + r.slug} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px', textDecoration: 'none' }}>
                        {lang === 'es' ? 'Ver pagina' : 'View page'}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div style={{ maxWidth: 640 }}>
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
                {lang === 'es' ? 'Historial de ganancias' : 'Earnings history'}
              </div>
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 13 }}>
                {lang === 'es' ? 'Sin rifas completadas aun.' : 'No completed raffles yet.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
