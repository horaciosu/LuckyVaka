import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import ImageUploader from '../components/ImageUploader'
import { supabase } from '../lib/supabase'

const AMENITIES_LIST = [
  { id: 'wifi', label: 'Wi-Fi', icon: '📶' },
  { id: 'ac', label: 'A/C', icon: '❄️' },
  { id: 'pool', label: 'Alberca / Pool', icon: '🏊' },
  { id: 'parking', label: 'Estacionamiento / Parking', icon: '🚗' },
  { id: 'kitchen', label: 'Cocina equipada / Kitchen', icon: '🍳' },
  { id: 'washer', label: 'Lavadora / Washer', icon: '👕' },
  { id: 'tv', label: 'Smart TV', icon: '📺' },
  { id: 'ocean', label: 'Vista al mar / Ocean view', icon: '🌊' },
  { id: 'beach', label: 'Acceso playa / Beach access', icon: '🏖' },
  { id: 'bbq', label: 'Asador / BBQ', icon: '🔥' },
  { id: 'jacuzzi', label: 'Jacuzzi', icon: '♨️' },
  { id: 'gym', label: 'Gimnasio / Gym', icon: '💪' },
  { id: 'security', label: 'Seguridad / Security', icon: '🔒' },
  { id: 'pets', label: 'Mascotas / Pet friendly', icon: '🐾' },
  { id: 'balcony', label: 'Balcón / Balcony', icon: '🌅' },
  { id: 'garden', label: 'Jardín / Garden', icon: '🌿' },
]

const PROPERTY_TYPES = [
  'Casa / House', 'Departamento / Apartment', 'Cabaña / Cabin',
  'Villa', 'Rancho / Ranch', 'Hotel boutique',
  'Yate / Yacht', 'Isla privada / Private island', 'Otro / Other',
]

const empty = {
  name: '', property_type: '', address: '', city: '', state: '', zip_code: '', country: 'México',
  beds: 2, baths: 1, guests: 4,
  amenities: [],
  description_es: '', description_en: '',
  house_rules: '',
  checkin_time: '15:00', checkout_time: '11:00',
  images: [],
  status: 'pending',
}

export default function MyProperties({ lang, setLang }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [view, setView] = useState('list') // list | form
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [editing, setEditing] = useState(null) // property id being edited
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  const t = (en, es) => lang === 'es' ? es : en
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (!u) { router.push('/login'); return }
      setUser(u)
      loadProperties(u.id)
    })
  }, [])

  const loadProperties = async (uid) => {
    setLoading(true)
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('host_id', uid)
      .order('created_at', { ascending: false })
    setProperties(data || [])
    setLoading(false)
  }

  const toggleAmenity = (id) => {
    const list = form.amenities.includes(id)
      ? form.amenities.filter(x => x !== id)
      : [...form.amenities, id]
    update('amenities', list)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = true
    if (!form.property_type) e.property_type = true
    if (!form.address.trim()) e.address = true
    if (!form.city.trim()) e.city = true
    if (!form.description_es.trim()) e.description_es = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    setSaveMsg(null)
    const { data: { session: freshSession } } = await supabase.auth.getSession()
    const freshUserId = freshSession?.user?.id

    const payload = {
      ...form,
      host_id: freshUserId,
      status: 'pending',
    }

    let error
    if (editing) {
      const res = await supabase.from('properties').update(payload).eq('id', editing)
      error = res.error
    } else {
      const res = await supabase.from('properties').insert(payload)
      error = res.error
    }

    if (error) {
      setSaveMsg({ type: 'error', text: error.message })
    } else {
      setSaveMsg({
        type: 'success',
        text: t('Property saved successfully!', '¡Propiedad guardada correctamente!')
      })
      await loadProperties(freshUserId)
      setTimeout(() => { setView('list'); setForm(empty); setEditing(null); setSaveMsg(null) }, 1500)
    }
    setSaving(false)
  }

  const handleEdit = (prop) => {
    setForm({
      name: prop.name || '',
      property_type: prop.property_type || '',
      address: prop.address || '',
      city: prop.city || '',
      state: prop.state || '',
      zip_code: prop.zip_code || '',
      country: prop.country || 'México',
      beds: prop.beds || 2,
      baths: prop.baths || 1,
      guests: prop.guests || 4,
      amenities: prop.amenities || [],
      description_es: prop.description_es || '',
      description_en: prop.description_en || '',
      house_rules: prop.house_rules || '',
      checkin_time: prop.checkin_time || '15:00',
      checkout_time: prop.checkout_time || '11:00',
      images: prop.images || [],
      status: prop.status || 'pending',
    })
    setEditing(prop.id)
    setView('form')
  }

  const inp = (field) => ({
    value: form[field],
    onChange: e => { update(field, e.target.value); setErrors(er => ({ ...er, [field]: false })) },
    style: {
      width: '100%', padding: '9px 12px',
      border: `1px solid ${errors[field] ? '#E24B4A' : 'var(--border)'}`,
      borderRadius: 8, fontSize: 13,
      background: 'var(--surface)', color: 'var(--text)', outline: 'none',
    },
  })

  const statusBadge = (status) => {
    const map = {
      pending:  { bg: '#FAEEDA', color: '#633806', label: t('Pending review', 'Pendiente revisión') },
      approved: { bg: '#E1F5EE', color: '#0F6E56', label: t('Approved', 'Aprobada') },
      rejected: { bg: '#FCEBEB', color: '#A32D2D', label: t('Rejected', 'Rechazada') },
    }
    const s = map[status] || map.pending
    return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, fontWeight: 500 }}>{s.label}</span>
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
              🏡 {t('My properties', 'Mis propiedades')}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              {t('Register your properties once, raffle them anytime.', 'Registra tus propiedades una vez, ráfalas cuando quieras.')}
            </p>
          </div>
          {view === 'list' && (
            <button onClick={() => { setForm(empty); setEditing(null); setView('form') }} className="btn-primary" style={{ fontSize: 13 }}>
              + {t('New property', 'Nueva propiedad')}
            </button>
          )}
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: 'var(--muted)' }}>
                ⏳ {t('Loading...', 'Cargando...')}
              </div>
            ) : properties.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏡</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                  {t('No properties yet', 'Aún no tienes propiedades')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
                  {t('Register your first property to start creating raffles.', 'Registra tu primera propiedad para empezar a crear rifas.')}
                </div>
                <button onClick={() => setView('form')} className="btn-primary">
                  + {t('Register first property', 'Registrar primera propiedad')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {properties.map(p => (
                  <div key={p.id} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg)' }}>
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏡</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>📍 {p.city}{p.zip_code ? ` ${p.zip_code}` : ''}, {p.country}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {statusBadge(p.status)}
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>🛏 {p.beds} · 🚿 {p.baths} · 👥 {p.guests}</span>
                      </div>
                    </div>
                    <button onClick={() => handleEdit(p)} className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}>
                      ✏️ {t('Edit', 'Editar')}
                    </button>
                  </div>
                ))}
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <button onClick={() => { setForm(empty); setEditing(null); setView('form') }} className="btn-secondary" style={{ fontSize: 13 }}>
                    + {t('Add another property', 'Agregar otra propiedad')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FORM VIEW */}
        {view === 'form' && (
          <div>
            <button onClick={() => { setView('list'); setForm(empty); setEditing(null) }} style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
              ← {t('Back to my properties', 'Regresar a mis propiedades')}
            </button>

            {/* SECTION 1 — Basic info */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                📋 {t('Basic information', 'Información básica')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Property name', 'Nombre de la propiedad')} *</label>
                  <input {...inp('name')} placeholder={t('Beach House San Carlos', 'Casa de playa San Carlos')} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Property type', 'Tipo')} *</label>
                  <select value={form.property_type} onChange={e => { update('property_type', e.target.value); setErrors(er => ({ ...er, property_type: false })) }}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${errors.property_type ? '#E24B4A' : 'var(--border)'}`, borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                    <option value="">{t('Select...', 'Selecciona...')}</option>
                    {PROPERTY_TYPES.map(pt => <option key={pt}>{pt}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Full address', 'Dirección completa')} *</label>
                <input {...inp('address')} placeholder="Calle Mar de Cortés 123, Col. Centro" />
              </div>
              {/* Ciudad, CP, Estado, País */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('City', 'Ciudad')} *</label>
                  <input {...inp('city')} placeholder="San Carlos" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('ZIP / Postal code', 'Código postal')}</label>
                  <input {...inp('zip_code')} placeholder="85506" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('State', 'Estado')}</label>
                  <input {...inp('state')} placeholder="Sonora" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Country', 'País')}</label>
                  <select value={form.country} onChange={e => update('country', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                    <option>México</option>
                    <option>United States</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2 — Composition */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                🛏 {t('Property composition', 'Composición de la propiedad')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  ['beds', '🛏', t('Bedrooms', 'Habitaciones')],
                  ['baths', '🚿', t('Bathrooms', 'Baños')],
                  ['guests', '👥', t('Max guests', 'Huéspedes máx')],
                ].map(([field, icon, label]) => (
                  <div key={field}>
                    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{icon} {label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button type="button" onClick={() => update(field, Math.max(1, form[field] - 1))}
                        style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 16, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', minWidth: 24, textAlign: 'center' }}>{form[field]}</span>
                      <button type="button" onClick={() => update(field, form[field] + 1)}
                        style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 16, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Check-in / Check-out times */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>🕒 {t('Check-in time', 'Hora de entrada')}</label>
                  <select value={form.checkin_time} onChange={e => update('checkin_time', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                    {['12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(t => <option key={t}>{t} hrs</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>🕙 {t('Check-out time', 'Hora de salida')}</label>
                  <select value={form.checkout_time} onChange={e => update('checkout_time', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                    {['09:00','10:00','11:00','12:00','13:00','14:00'].map(t => <option key={t}>{t} hrs</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3 — Amenities */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                ✨ {t('Amenities', 'Amenidades')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {AMENITIES_LIST.map(a => (
                  <button key={a.id} type="button" onClick={() => toggleAmenity(a.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: '1px solid',
                    borderColor: form.amenities.includes(a.id) ? 'var(--brand)' : 'var(--border)',
                    background: form.amenities.includes(a.id) ? 'var(--brand-light)' : 'transparent',
                    color: form.amenities.includes(a.id) ? 'var(--brand-dark)' : 'var(--muted)',
                    fontWeight: form.amenities.includes(a.id) ? 500 : 400,
                  }}>
                    <span>{a.icon}</span> {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 4 — Description */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                📝 {t('Description', 'Descripción')}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Description in Spanish', 'Descripción en español')} *</label>
                <textarea {...inp('description_es')} rows={4} placeholder="Hermosa casa frente al mar con vista al Golfo de California..." style={{ ...inp('description_es').style, resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Description in English', 'Descripción en inglés')}</label>
                <textarea {...inp('description_en')} rows={4} placeholder="Beautiful oceanfront home with stunning views of the Sea of Cortez..." style={{ ...inp('description_en').style, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('House rules', 'Reglas de la casa')}</label>
                <textarea {...inp('house_rules')} rows={3} placeholder={t('No smoking, no parties, no pets...', 'No fumar, no fiestas, no mascotas...')} style={{ ...inp('house_rules').style, resize: 'vertical' }} />
              </div>
            </div>

            {/* SECTION 5 — Photos */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                📸 {t('Property photos', 'Fotos de la propiedad')}
              </div>
              <ImageUploader
                propertyId={editing || 'new-property'}
                lang={lang}
                onUploadComplete={(urls) => update('images', urls)}
              />
              {form.images?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                    {t('Current photos:', 'Fotos actuales:')} {form.images.length}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {form.images.slice(0, 6).map((url, i) => (
                      <img key={i} src={url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: i === 0 ? '2px solid var(--brand)' : '1px solid var(--border)' }} />
                    ))}
                    {form.images.length > 6 && (
                      <div style={{ width: 64, height: 64, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--muted)' }}>
                        +{form.images.length - 6}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: 4 }}>⭐ {t('First photo is the main image', 'La primera foto es la imagen principal')}</div>
                </div>
              )}
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

            <div style={{ background: '#E6F1FB', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#185FA5', marginBottom: 16 }}>
              ℹ️ {t('Your property will be reviewed by our team before going live. This usually takes 24-48 hours.', 'Tu propiedad será revisada por nuestro equipo antes de publicarse. Esto tarda 24-48 horas.')}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setView('list'); setForm(empty); setEditing(null) }} className="btn-secondary">
                {t('Cancel', 'Cancelar')}
              </button>
              <button onClick={handleSave} className="btn-primary" disabled={saving}>
                {saving ? '⏳ ' + t('Saving...', 'Guardando...') : '💾 ' + t('Save property', 'Guardar propiedad')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
