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
  const [loadingRaffles, setLoadingRaffles] = useState(false)
  const [uploadedImages, setUploadedImages] = useState([])

  // Form fields
  const [propertyName, setPropertyName] = useState('')
  const [location, setLocation] = useState('San Carlos, Sonora, MX')
  const [stayDate, setStayDate] = useState('')
  const [drawDate, setDrawDate] = useState('')

  const gross = ticketPrice * totalTickets
  const comm = gross * 0.18
  const ins = gross * 0.05
  const net = gross - comm - ins

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setUser(u)
      if (!u) router.push('/login')
    })
  }, [])

  useEffect(() => {
    if (activeTab === 'raffles' && user) loadMyRaffles()
  }, [activeTab, user])

  const loadMyRaffles = async () => {
    setLoadingRaffles(true)
    const { data } = await supabase
      .from('raffles')
      .select('*, properties(name, city)')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false })
    setMyRaffles(data || [])
    setLoadingRaffles(false)
  }

  const buildSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
    '-' + Date.now().toString().slice(-5)

  const saveRaffle = async (status = 'draft') => {
    if (!propertyName.trim()) { setSaveMsg({ type: 'error', text: lang === 'es' ? 'Agrega el nombre de la propiedad' : 'Add property name' }); return }
    if (status === 'active' && (!stayDate || !drawDate)) { setSaveMsg({ type: 'error', text: lang === 'es' ? 'Agrega las fechas del sorteo y estancia' : 'Add draw and stay dates' }); return }

    status === 'draft' ? setSaving(true) : setPublishing(true)
    setSaveMsg(null)

    try {
      // 1. Create property
      const { data: prop, error: propErr } = await supabase
        .from('properties')
        .insert({
          host_id: user.id,
          name: propertyName,
          city: location.split(',')[0]?.trim(),
          country: location.includes('MX') ? 'México' : 'United States',
          images: uploadedImages,
          status: status === 'active' ? 'approved' : 'pending',
        })
        .select()
        .single()

      if (propErr) throw propErr

      // 2. Create raffle
      const { data: raffle, error: raffleErr } = await supabase
        .from('raffles')
        .insert({
          property_id: prop.id,
          host_id: user.id,
          slug: buildSlug(propertyName),
          ticket_price: ticketPrice,
          currency,
          total_tickets: totalTickets,
          min_tickets: Math.round(totalTickets * minPct / 100),
          draw_date: drawDate || null,
          stay_date: stayDate || null,
          status,
        })
        .select()
        .single()

      if (raffleErr) throw raffleErr

      setSaveMsg({
        type: 'success',
        text: status === 'draft'
          ? (lang === 'es' ? '✅ Borrador guardado correctamente' : '✅ Draft saved successfully')
          : (lang === 'es' ? '🚀 ¡Rifa publicada! Ya está visible en la plataforma' : '🚀 Raffle published! Now live on the platform'),
      })

      if (status === 'active') {
        setTimeout(() => setActiveTab('raffles'), 1500)
      }
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
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: lang === 'es' ? 'Total ganado' : 'Total earned', val: '$3,850', sub: '↑ $1,200 este mes' },
                { label: lang === 'es' ? 'Rifas activas' : 'Active raffles', val: '2', sub: '1 ending soon' },
                { label: lang === 'es' ? 'Boletos vendidos' : 'Tickets sold', val: '499', sub: '↑ 23 today' },
                { label: lang === 'es' ? 'Ganadores' : 'Winners hosted', val: '3', sub: '⭐ 4.9 avg' },
              ].map((m, i) => (
                <div key={i} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>{m.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: 3 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
                  {lang === 'es' ? 'Rifas activas' : 'Active raffles'}
                </div>
                {[
                  { emoji: '🌊', name: 'Beach House — San Carlos MX', pct: 62, sold: 187, total: 300 },
                  { emoji: '🏡', name: 'Modern Home — Tucson AZ', pct: 78, sold: 312, total: 400 },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 44, height: 36, borderRadius: 6, background: i === 0 ? 'linear-gradient(135deg,#b3e0f7,#81c8f0)' : 'linear-gradient(135deg,#c8e6c9,#a5d6a7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{r.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{r.name}</div>
                      <div className="progress-bar" style={{ marginTop: 4 }}>
                        <div className="progress-fill" style={{ width: `${r.pct}%` }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12 }}>
                      <div style={{ fontWeight: 600 }}>{r.pct}%</div>
                      <div style={{ color: 'var(--muted)', fontSize: 10 }}>{r.sold}/{r.total}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Recent activity</div>
                {[
                  'Carlos M. bought 3 tickets — San Carlos',
                  'Sarah T. bought 1 ticket — Tucson',
                  'Ana R. bought 5 tickets — San Carlos',
                  '🎉 Tucson draw completed — winner notified',
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', fontSize: 12, color: 'var(--muted)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0, marginTop: 5 }} />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NEW RAFFLE */}
        {activeTab === 'new' && (
          <div style={{ maxWidth: 640 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                {lang === 'es' ? 'Información de la propiedad' : 'Property information'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Property name *</label>
                  <input value={propertyName} onChange={e => setPropertyName(e.target.value)}
                    placeholder={lang === 'es' ? 'Casa de playa San Carlos' : 'Beach House — San Carlos'}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Location *</label>
                  <select value={location} onChange={e => setLocation(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                    <option>San Carlos, Sonora, MX</option>
                    <option>Tucson, Arizona, USA</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>
                  {lang === 'es' ? 'Fotos de la propiedad' : 'Property photos'} *
                </label>
                <ImageUploader
                  propertyId="new-property"
                  lang={lang}
                  onUploadComplete={(urls) => setUploadedImages(urls)}
                />
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
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Stay date *</label>
                  <input type="date" value={stayDate} onChange={e => setStayDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Draw date *</label>
                  <input type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
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
                [lang === 'es' ? 'Venta total' : 'Gross sales', `${gross.toFixed(2)} ${currency}`],
                ['Platform commission (18%)', `-${comm.toFixed(2)} ${currency}`],
                ['Insurance & ops (5%)', `-${ins.toFixed(2)} ${currency}`],
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

            {/* Save message */}
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
              <button
                onClick={() => saveRaffle('draft')}
                className="btn-secondary"
                disabled={saving}
              >
                {saving ? '⏳ ' + (lang === 'es' ? 'Guardando...' : 'Saving...') : '💾 ' + (lang === 'es' ? 'Guardar borrador' : 'Save draft')}
              </button>
              <button
                onClick={() => saveRaffle('active')}
                className="btn-primary"
                disabled={publishing}
              >
                {publishing ? '⏳ ' + (lang === 'es' ? 'Publicando...' : 'Publishing...') : '🚀 ' + (lang === 'es' ? 'Publicar rifa' : 'Publish raffle')}
              </button>
            </div>
          </div>
        )}

        {/* MY RAFFLES */}
        {activeTab === 'raffles' && (
          <div>
            <div className="card">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Property', 'Status', 'Tickets', 'Draw date', 'Est. payout', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Beach House — San Carlos MX', status: 'active', sold: 187, total: 300, draw: 'Jul 8', payout: '~$1,155' },
                    { name: 'Modern Home — Tucson AZ', status: 'active', sold: 312, total: 400, draw: 'Apr 15', payout: '~$2,695' },
                    { name: 'Beach House — San Carlos MX', status: 'completed', sold: 300, total: 300, draw: 'Feb 10', payout: '$1,155 ✓' },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 500 }}>{r.name}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: r.status === 'active' ? 'var(--brand-light)' : '#F4F3EF', color: r.status === 'active' ? 'var(--brand-dark)' : 'var(--muted)' }}>
                          {r.status === 'active' ? '● active' : '✓ done'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div>{r.sold}/{r.total}</div>
                        <div className="progress-bar" style={{ width: 80, marginTop: 3 }}>
                          <div className="progress-fill" style={{ width: `${Math.round(r.sold/r.total*100)}%` }} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--muted)' }}>{r.draw}</td>
                      <td style={{ padding: '12px 10px', color: 'var(--brand)', fontWeight: 500 }}>{r.payout}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <button onClick={() => setActiveTab('new')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--muted)' }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setActiveTab('new')} className="btn-primary" style={{ marginTop: 16 }}>+ Create new raffle</button>
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
