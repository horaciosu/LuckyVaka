import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import PropertyMap from '../../components/PropertyMap'
import { supabase } from '../../lib/supabase'

const AMENITY_ICONS = {
  wifi: '📶', ac: '❄️', pool: '🏊', parking: '🚗', kitchen: '🍳',
  washer: '👕', tv: '📺', ocean: '🌊', beach: '🏖', bbq: '🔥',
  jacuzzi: '♨️', gym: '💪', security: '🔒', pets: '🐾', balcony: '🌅', garden: '🌿',
}

const AMENITY_LABELS_ES = {
  wifi: 'Wi-Fi', ac: 'A/C', pool: 'Alberca', parking: 'Estacionamiento', kitchen: 'Cocina equipada',
  washer: 'Lavadora', tv: 'Smart TV', ocean: 'Vista al mar', beach: 'Acceso playa', bbq: 'Asador',
  jacuzzi: 'Jacuzzi', gym: 'Gimnasio', security: 'Seguridad', pets: 'Mascotas OK', balcony: 'Balcón', garden: 'Jardín',
}

const AMENITY_LABELS_EN = {
  wifi: 'Wi-Fi', ac: 'A/C', pool: 'Pool', parking: 'Parking', kitchen: 'Full kitchen',
  washer: 'Washer', tv: 'Smart TV', ocean: 'Ocean view', beach: 'Beach access', bbq: 'BBQ',
  jacuzzi: 'Jacuzzi', gym: 'Gym', security: 'Security', pets: 'Pet friendly', balcony: 'Balcony', garden: 'Garden',
}

export default function RafflePage({ lang, setLang }) {
  const router = useRouter()
  const { slug } = router.query

  const [raffle, setRaffle] = useState(null)
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [qty, setQty] = useState(1)
  const [selected, setSelected] = useState(new Set())
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [activePhoto, setActivePhoto] = useState(0)

  const t = (en, es) => lang === 'es' ? es : en

  useEffect(() => {
    if (!slug) return
    loadRaffle()
  }, [slug])

  const loadRaffle = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('raffles')
      .select('*, properties(*)')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setRaffle(data)
    setProperty(data.properties)
    setLoading(false)
  }

  useEffect(() => {
    if (!raffle?.draw_date) return
    const target = new Date(raffle.draw_date + 'T20:00:00')
    const tick = () => {
      const diff = target - new Date()
      if (diff <= 0) { setCountdown({ d: 0, h: 0, m: 0, s: 0 }); return }
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [raffle?.draw_date])

  const taken = new Set()
  if (raffle) {
    for (let i = 1; i <= (raffle.tickets_sold || 0); i++) {
      taken.add((i * 7 + 13) % raffle.total_tickets + 1)
    }
  }

  const toggleNum = (n) => {
    if (taken.has(n)) return
    const next = new Set(selected)
    if (next.has(n)) { next.delete(n) }
    else {
      if (next.size >= qty) { const first = [...next][0]; next.delete(first) }
      next.add(n)
    }
    setSelected(next)
  }

  const pickRandom = () => {
    if (!raffle) return
    const avail = []
    for (let i = 1; i <= raffle.total_tickets; i++) { if (!taken.has(i)) avail.push(i) }
    avail.sort(() => Math.random() - 0.5)
    setSelected(new Set(avail.slice(0, qty)))
  }

  const pad = n => String(n).padStart(2, '0')

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ textAlign: 'center', padding: '80px 0', fontSize: 13, color: 'var(--muted)' }}>
        ⏳ {t('Loading raffle...', 'Cargando rifa...')}
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text)', marginBottom: 16 }}>
          {t('Raffle not found', 'Rifa no encontrada')}
        </h1>
        <Link href="/raffles" className="btn-primary">{t('Browse all raffles', 'Ver todas las rifas')}</Link>
      </div>
    </div>
  )

  const ticketsSold = raffle.tickets_sold || 0
  const pct = Math.round((ticketsSold / raffle.total_tickets) * 100)
  const remaining = raffle.total_tickets - ticketsSold
  const fee = +(qty * raffle.ticket_price * 0.1).toFixed(2)
  const cleaningFee = raffle.cleaning_fee || 0
  const subtotal = +(qty * raffle.ticket_price).toFixed(2)
  const total = +(subtotal + fee).toFixed(2)
  const images = property?.images || []
  const amenities = property?.amenities || []
  const amenityLabels = lang === 'es' ? AMENITY_LABELS_ES : AMENITY_LABELS_EN

  // FIX 5: mostrar todos los boletos, no solo 100
  const totalToShow = raffle.total_tickets

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />

      {/* FIX 6: layout 55/45 en lugar de 1fr/320px — panel derecho más grande */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <Link href="/raffles" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← {t('Back', 'Regresar')}
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 28, alignItems: 'start' }}>

          {/* LEFT */}
          <div>
            {/* Gallery */}
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20, border: '1px solid var(--border)' }}>
              <div style={{ height: 320, position: 'relative', background: '#F4F3EF' }}>
                {images.length > 0 ? (
                  <img src={images[activePhoto]} alt={property?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🏡</div>
                )}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setActivePhoto(p => Math.max(0, p - 1))} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 18 }}>‹</button>
                    <button onClick={() => setActivePhoto(p => Math.min(images.length - 1, p + 1))} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 18 }}>›</button>
                    <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 12 }}>{activePhoto + 1} / {images.length}</div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 4, padding: 8, overflowX: 'auto', background: 'var(--surface)' }}>
                  {images.map((img, i) => (
                    <img key={i} src={img} onClick={() => setActivePhoto(i)} style={{ width: 56, height: 48, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', flexShrink: 0, border: i === activePhoto ? '2px solid var(--brand)' : '2px solid transparent', opacity: i === activePhoto ? 1 : 0.65 }} />
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              {property?.name || slug}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
              📍 {property?.city}{property?.state ? `, ${property.state}` : ''}, {property?.country}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--muted)', marginBottom: 16, flexWrap: 'wrap' }}>
              {property?.beds && <span>🛏 {property.beds} {t('bed', 'hab')}</span>}
              {property?.baths && <span>🚿 {property.baths} {t('bath', 'baño')}</span>}
              {property?.guests && <span>👥 {t('up to', 'hasta')} {property.guests} {t('guests', 'huéspedes')}</span>}
              {property?.checkin_time && <span>🕒 Check-in {property.checkin_time.replace(' hrs','')}</span>}
              {property?.checkout_time && <span>🕙 Check-out {property.checkout_time.replace(' hrs','')}</span>}
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {amenities.map(a => (
                  <span key={a} style={{ fontSize: 11, background: '#F4F3EF', color: 'var(--muted)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {AMENITY_ICONS[a] || '✓'} {amenityLabels[a] || a}
                  </span>
                ))}
              </div>
            )}

            {/* FIX 1: Descripción — solo mostrar si hay contenido */}
            {(property?.description_es || property?.description_en) && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  {t('About this stay', 'Sobre la estancia')}
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                  {lang === 'es' ? (property?.description_es || property?.description_en) : (property?.description_en || property?.description_es)}
                </p>
              </div>
            )}

            {/* FIX 2: Stay details — checkout_time desde property */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                🗓 {t('Stay details', 'Detalles de la estancia')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['🟢', t('Check-in', 'Entrada'), formatDate(raffle.stay_date), property?.checkin_time || ''],
                  ['🔴', t('Check-out', 'Salida'), formatDate(raffle.checkout_date), property?.checkout_time || ''],
                  ['🎯', t('Draw date', 'Fecha del sorteo'), formatDate(raffle.draw_date), ''],
                  ['🧹', t('Cleaning fee', 'Limpieza'), cleaningFee > 0 ? `${cleaningFee} ${raffle.currency}` : t('Included', 'Incluida'), ''],
                ].map(([icon, label, val, time]) => (
                  <div key={label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{icon} {label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{val}</div>
                    {time && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{time}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* House rules */}
            {property?.house_rules && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  📋 {t('House rules', 'Reglas de la casa')}
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>{property.house_rules}</p>
              </div>
            )}

            {/* FIX 3: Mapa compacto */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                📍 {t('Location', 'Ubicación')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{property?.city}{property?.state ? `, ${property.state}` : ''}, {property?.country}</div>
              </div>
              <div style={{ borderRadius: 8, overflow: 'hidden', height: 200 }}>
                <PropertyMap
                  location={property?.address ? `${property.address}, ${property?.city}, ${property?.country}` : `${property?.city || ''}, ${property?.country || ''}`}
                  lang={lang}
                  apiKey="AIzaSyCI5qOJqVrvT1HEhaaQ4vcUi5Lb01uOf70"
                />
              </div>
            </div>
          </div>

          {/* RIGHT — sticky, más ancho */}
          <div style={{ position: 'sticky', top: 80 }}>
            {/* Countdown */}
            <div className="card" style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>{t('Draw in', 'Sorteo en')}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                {[[countdown.d, t('days','días')],[countdown.h,'hrs'],[countdown.m,'min'],[countdown.s,'sec']].map(([val, label], i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div className="countdown-digit" style={{ fontSize: 28, fontWeight: 700 }}>{pad(val)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ fontWeight: 500 }}>{ticketsSold} {t('sold','vendidos')}</span>
                <span style={{ color: 'var(--muted)' }}>{raffle.total_tickets} total</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                {pct}% {t('sold','vendido')} · {remaining} {t('remaining','restantes')}
              </div>
            </div>

            {/* FIX 4: Precio sin "en juego" */}
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>{raffle.ticket_price} {raffle.currency}</span>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t('per ticket','por boleto')}</div>
            </div>

            {/* Qty */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{t('How many tickets?','¿Cuántos boletos?')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ width:36,height:36,borderRadius:8,border:'1px solid var(--border)',background:'transparent',fontSize:20,cursor:'pointer',color:'var(--text)',display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
                <span style={{ fontSize:20,fontWeight:600,minWidth:28,textAlign:'center' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(20, q+1))} style={{ width:36,height:36,borderRadius:8,border:'1px solid var(--border)',background:'transparent',fontSize:20,cursor:'pointer',color:'var(--text)',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
                <span style={{ fontSize:11,color:'var(--muted)' }}>{qty} {t('in','en')} {raffle.total_tickets}</span>
              </div>
              <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                {[1,3,5,10,20].map(n => (
                  <button key={n} onClick={() => setQty(n)} style={{ fontSize:12,padding:'5px 12px',borderRadius:6,cursor:'pointer',border:'1px solid var(--border)',background:qty===n?'var(--brand)':'transparent',color:qty===n?'#fff':'var(--muted)' }}>×{n}</button>
                ))}
              </div>
            </div>

            {/* FIX 5: Number picker — mostrar todos los boletos con scroll */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize:12,color:'var(--muted)',marginBottom:8 }}>
                {t('Pick your numbers','Elige tus números')} <span style={{ color:'var(--brand)',fontSize:10 }}>({selected.size} {t('selected','seleccionados')})</span>
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:4,maxHeight:160,overflowY:'auto' }}>
                {Array.from({length: totalToShow},(_,i)=>i+1).map(n => (
                  <button key={n} onClick={() => toggleNum(n)} className={`ticket-chip ${taken.has(n)?'taken':''} ${selected.has(n)?'selected':''}`}>{n}</button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ background:'#F4F3EF',borderRadius:8,padding:'12px 14px',marginBottom:12 }}>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--muted)',marginBottom:4 }}>
                <span>{qty} × {raffle.ticket_price} {raffle.currency}</span><span>{subtotal.toFixed(2)}</span>
              </div>
              {cleaningFee > 0 && (
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--muted)',marginBottom:4 }}>
                  <span>🧹 {t('Cleaning fee','Limpieza')}</span><span>{cleaningFee}</span>
                </div>
              )}
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--muted)',marginBottom:6 }}>
                <span>{t('Platform fee (10%)','Comisión (10%)')}</span><span>{fee}</span>
              </div>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:600,color:'var(--text)',borderTop:'1px solid var(--border)',paddingTop:6 }}>
                <span>Total</span><span>{total} {raffle.currency}</span>
              </div>
            </div>

            <button onClick={pickRandom} style={{ width:'100%',background:'transparent',border:'1px solid var(--border)',borderRadius:8,padding:'10px',fontSize:13,cursor:'pointer',color:'var(--muted)',marginBottom:8 }}>
              🍀 {t('Pick for me','Elige por mí')}
            </button>

            <Link href={`/checkout?raffle=${raffle.slug}&qty=${qty}&tickets=${[...selected].join(',')}`} className="btn-primary" style={{ width:'100%',justifyContent:'center',marginBottom:8,fontSize:15 }}>
              🔒 {lang === 'es' ? `Comprar — ${total} ${raffle.currency}` : `Buy tickets — ${total} ${raffle.currency}`}
            </Link>

            <div style={{ fontSize:11,color:'var(--muted)',textAlign:'center',lineHeight:1.5 }}>
              ✓ {t('Guaranteed winner · Full refund if minimum not reached','Ganador garantizado · Reembolso si no se alcanza el mínimo')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
