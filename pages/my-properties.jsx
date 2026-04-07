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

const STEPS = [
  { id: 1, icon: '🏠', label_es: 'Info básica', label_en: 'Basic info' },
  { id: 2, icon: '🛏', label_es: 'Composición', label_en: 'Composition' },
  { id: 3, icon: '📝', label_es: 'Descripción', label_en: 'Description' },
  { id: 4, icon: '✨', label_es: 'Amenidades', label_en: 'Amenities' },
  { id: 5, icon: '📄', label_es: 'Documentos', label_en: 'Documents' },
  { id: 6, icon: '📸', label_es: 'Fotografías', label_en: 'Photos' },
]

const DOCS_CONFIG = [
  { key: 'deed_doc', label_es: 'Escrituras o título de propiedad', label_en: 'Property deed or title', required: true },
  { key: 'address_doc', label_es: 'Comprobante de domicilio de la propiedad', label_en: 'Property proof of address', required: true },
  { key: 'fiscal_doc', label_es: 'Constancia de situación fiscal', label_en: 'Tax registration (RFC)', required: true },
  { key: 'id_front_doc', label_es: 'INE / Identificación oficial (frente)', label_en: 'Official ID - front side', required: true },
  { key: 'id_back_doc', label_es: 'INE / Identificación oficial (reverso)', label_en: 'Official ID - back side', required: true },
  { key: 'passport_doc', label_es: 'Pasaporte', label_en: 'Passport', required: false },
  { key: 'curp_doc', label_es: 'CURP', label_en: 'CURP', required: false },
]

const empty = {
  name: '', property_type: '', address: '', city: '', state: '', zip_code: '', country: 'México',
  beds: 2, baths: 1, guests: 4,
  amenities: [],
  description_es: '', description_en: '',
  house_rules: '',
  checkin_time: '15:00', checkout_time: '11:00',
  images: [],
  status: 'pending_review',
  deed_doc_url: '', address_doc_url: '', fiscal_doc_url: '',
  id_front_doc_url: '', id_back_doc_url: '', passport_doc_url: '', curp_doc_url: '',
}

export default function MyProperties({ lang, setLang }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [view, setView] = useState('list')
  const [step, setStep] = useState(1)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('luckyvaka_property_draft')
      if (saved) {
        try { return JSON.parse(saved) } catch(e) {}
      }
    }
    return empty
  })
  const [errors, setErrors] = useState({})
  const [docUploading, setDocUploading] = useState({})
  const [docErrors, setDocErrors] = useState({})

  const t = (en, es) => lang === 'es' ? es : en
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Persistir borrador en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && view === 'form') {
      localStorage.setItem('luckyvaka_property_draft', JSON.stringify(form))
    }
  }, [form, view])

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

  const uploadPropertyDoc = async (file, docKey) => {
    if (!file) return
    setDocUploading(p => ({ ...p, [docKey]: true }))
    setDocErrors(p => ({ ...p, [docKey]: false }))
    const fileName = 'property-docs/' + (user?.id || 'unknown') + '/' + docKey + '-' + Date.now() + '-' + file.name
    const { error } = await supabase.storage.from('host-documents').upload(fileName, file, { upsert: true })
    if (error) {
      setDocErrors(p => ({ ...p, [docKey]: true }))
    } else {
      const { data } = supabase.storage.from('host-documents').getPublicUrl(fileName)
      update(docKey + '_url', data.publicUrl)
    }
    setDocUploading(p => ({ ...p, [docKey]: false }))
  }

  const validateStep = (s) => {
    const e = {}
    if (s === 1) {
      if (!form.name.trim()) e.name = true
      if (!form.property_type) e.property_type = true
      if (!form.address.trim()) e.address = true
      if (!form.city.trim()) e.city = true
    }
    if (s === 3) {
      if (!form.description_es.trim()) e.description_es = true
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = () => {
    if (!validateStep(step)) return
    setStep(s => Math.min(s + 1, STEPS.length))
  }
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)
    const payload = { ...form, host_id: user.id, status: 'pending_review' }
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
      setSaveMsg({ type: 'success', text: t('Property saved! Under review.', '¡Propiedad guardada! En revisión.') })
      await loadProperties(user.id)
      setTimeout(() => { setView('list'); setForm(empty); setEditing(null); setSaveMsg(null); setStep(1); if (typeof window !== 'undefined') localStorage.removeItem('luckyvaka_property_draft') }, 1800)
    }
    setSaving(false)
  }

  const handleEdit = (prop) => {
    setForm({
      name: prop.name || '', property_type: prop.property_type || '',
      address: prop.address || '', city: prop.city || '', state: prop.state || '',
      zip_code: prop.zip_code || '', country: prop.country || 'México',
      beds: prop.beds || 2, baths: prop.baths || 1, guests: prop.guests || 4,
      amenities: prop.amenities || [],
      description_es: prop.description_es || '', description_en: prop.description_en || '',
      house_rules: prop.house_rules || '',
      checkin_time: prop.checkin_time || '15:00', checkout_time: prop.checkout_time || '11:00',
      images: prop.images || [], status: prop.status || 'pending',
      deed_doc_url: prop.deed_doc_url || '', address_doc_url: prop.address_doc_url || '',
      fiscal_doc_url: prop.fiscal_doc_url || '', id_front_doc_url: prop.id_front_doc_url || '',
      id_back_doc_url: prop.id_back_doc_url || '', passport_doc_url: prop.passport_doc_url || '',
      curp_doc_url: prop.curp_doc_url || '',
    })
    setEditing(prop.id)
    setStep(1)
    setView('form')
  }

  const inp = (field) => ({
    value: form[field],
    onChange: e => { update(field, e.target.value); setErrors(er => ({ ...er, [field]: false })) },
    style: {
      width: '100%', padding: '9px 12px',
      border: '1px solid ' + (errors[field] ? '#E24B4A' : 'var(--border)'),
      borderRadius: 8, fontSize: 13,
      background: 'var(--surface)', color: 'var(--text)', outline: 'none',
    },
  })

  const statusBadge = (status) => {
    const map = {
      pending: { bg: '#FAEEDA', color: '#633806', label: t('Pending review', 'Pendiente revisión') },
      approved: { bg: '#E1F5EE', color: '#0F6E56', label: t('Approved', 'Aprobada') },
      rejected: { bg: '#FCEBEB', color: '#A32D2D', label: t('Rejected', 'Rechazada') },
    }
    const s = map[status] || map.pending
    return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: s.bg, color: s.color }}>{s.label}</span>
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>

        {/* LIST VIEW */}
        {view === 'list' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <a href="/host" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>← {t('Host panel', 'Panel anfitrión')}</a>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '4px 0 4px' }}>
                  🏡 {t('My properties', 'Mis propiedades')}
                </h1>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('Register your properties once, raffle them anytime.', 'Registra tus propiedades una vez, ráfalas cuando quieras.')}</p>
              </div>
              <button onClick={() => { setForm(empty); setEditing(null); setStep(1); setView('form') }} className="btn-primary" style={{ fontSize: 13 }}>
                + {t('New property', 'Nueva propiedad')}
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: 'var(--muted)' }}>🏠 {t('Loading...', 'Cargando...')}</div>
            ) : properties.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏡</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{t('No properties yet', 'Sin propiedades aún')}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>{t('Add your first property to start raffling.', 'Agrega tu primera propiedad para empezar a rifar.')}</div>
                <button onClick={() => { setForm(empty); setEditing(null); setStep(1); setView('form') }} className="btn-primary" style={{ fontSize: 13 }}>
                  + {t('Add property', 'Agregar propiedad')}
                </button>
              </div>
            ) : (
              <div>
                {properties.map(p => (
                  <div key={p.id} className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 72, height: 72, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🏠</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>📍 {p.city}{p.state ? ', ' + p.state : ''}, {p.country}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {statusBadge(p.status)}
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>🛏 {p.beds} · 🚿 {p.baths} · 👥 {p.guests}</span>
                      </div>
                    </div>
                    <button onClick={() => handleEdit(p)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text)', flexShrink: 0 }}>
                      ✏️ {t('Edit', 'Editar')}
                    </button>
                  </div>
                ))}
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button onClick={() => { setForm(empty); setEditing(null); setStep(1); setView('form') }} style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: '1px dashed var(--border)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>
                    + {t('Add another property', 'Agregar otra propiedad')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FORM VIEW — WIZARD */}
        {view === 'form' && (
          <div>
            <a href="#" onClick={e => { e.preventDefault(); setView('list'); setStep(1) }} style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>
              ← {t('Back to my properties', 'Regresar a mis propiedades')}
            </a>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '8px 0 20px' }}>
              {editing ? t('Edit property', 'Editar propiedad') : t('New property', 'Nueva propiedad')}
            </h2>

            {/* Progress steps */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
              {STEPS.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: s.id < step ? 'pointer' : 'default' }}
                    onClick={() => s.id < step && setStep(s.id)}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: step > s.id ? 16 : 14, fontWeight: 600,
                      background: step > s.id ? 'var(--brand)' : step === s.id ? 'var(--brand)' : 'var(--bg)',
                      color: step >= s.id ? '#fff' : 'var(--muted)',
                      border: step >= s.id ? 'none' : '1px solid var(--border)',
                    }}>
                      {step > s.id ? '✓' : s.icon}
                    </div>
                    <div style={{ fontSize: 10, color: step === s.id ? 'var(--brand)' : 'var(--muted)', marginTop: 4, textAlign: 'center', maxWidth: 60, lineHeight: 1.3 }}>
                      {t(s.label_en, s.label_es)}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ height: 1, width: 24, background: step > s.id ? 'var(--brand)' : 'var(--border)', margin: '0 4px', marginBottom: 20, flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>

            {/* STEP 1 — Basic info */}
            {step === 1 && (
              <div className="card">
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  🏠 {t('Basic information', 'Información básica')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Property name', 'Nombre de la propiedad')} *</label>
                    <input {...inp('name')} placeholder={t('Casa de playa San Carlos', 'Casa de playa San Carlos')} />
                    {errors.name && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 3 }}>{t('Required', 'Requerido')}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Property type', 'Tipo de propiedad')} *</label>
                    <select value={form.property_type} onChange={e => { update('property_type', e.target.value); setErrors(er => ({ ...er, property_type: false })) }}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + (errors.property_type ? '#E24B4A' : 'var(--border)'), borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                      <option value="">{t('Select...', 'Selecciona...')}</option>
                      {PROPERTY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                    </select>
                    {errors.property_type && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 3 }}>{t('Required', 'Requerido')}</div>}
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
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Full address', 'Dirección completa')} *</label>
                    <input {...inp('address')} placeholder="Calle Mar de Cortés 123, Col. Centro" />
                    {errors.address && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 3 }}>{t('Required', 'Requerido')}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('City', 'Ciudad')} *</label>
                    <input {...inp('city')} placeholder="San Carlos" />
                    {errors.city && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 3 }}>{t('Required', 'Requerido')}</div>}
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('State', 'Estado')}</label>
                    <input {...inp('state')} placeholder="Sonora" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('ZIP code', 'Código postal')}</label>
                    <input {...inp('zip_code')} placeholder="85506" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Composition */}
            {step === 2 && (
              <div className="card">
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  🛏 {t('Property composition', 'Composición de la propiedad')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[['beds', '🛏', t('Bedrooms', 'Habitaciones')], ['baths', '🚿', t('Bathrooms', 'Baños')], ['guests', '👥', t('Max guests', 'Huéspedes máx')]].map(([field, icon, label]) => (
                    <div key={field}>
                      <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>{icon} {label}</label>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>🕒 {t('Check-in time', 'Hora de entrada')}</label>
                    <select value={form.checkin_time} onChange={e => update('checkin_time', e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                      {['12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(ti => <option key={ti}>{ti} hrs</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>🕙 {t('Check-out time', 'Hora de salida')}</label>
                    <select value={form.checkout_time} onChange={e => update('checkout_time', e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                      {['09:00','10:00','11:00','12:00','13:00','14:00'].map(ti => <option key={ti}>{ti} hrs</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — Description */}
            {step === 3 && (
              <div className="card">
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  📝 {t('Description', 'Descripción')}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Description in Spanish', 'Descripción en español')} *</label>
                  <textarea {...inp('description_es')} rows={4} placeholder="Hermosa casa frente al mar con vista al Golfo de California..." style={{ ...inp('description_es').style, resize: 'vertical' }} />
                  {errors.description_es && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 3 }}>{t('Required', 'Requerido')}</div>}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Description in English', 'Descripción en inglés')}</label>
                  <textarea {...inp('description_en')} rows={4} placeholder="Beautiful oceanfront home..." style={{ ...inp('description_en').style, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('House rules', 'Reglas de la casa')}</label>
                  <textarea {...inp('house_rules')} rows={3} placeholder={t('No smoking, no parties...', 'No fumar, no fiestas...')} style={{ ...inp('house_rules').style, resize: 'vertical' }} />
                </div>
              </div>
            )}

            {/* STEP 4 — Amenities */}
            {step === 4 && (
              <div className="card">
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  ✨ {t('Amenities', 'Amenidades')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {AMENITIES_LIST.map(a => (
                    <button key={a.id} type="button" onClick={() => toggleAmenity(a.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '8px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
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
                {form.amenities.length > 0 && (
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
                    {form.amenities.length} {t('selected', 'seleccionadas')}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5 — Documents */}
            {step === 5 && (
              <div className="card">
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  📄 {t('Property documents', 'Documentos de la propiedad')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                  {t('Upload the required documents to verify your property. Files are stored securely.', 'Sube los documentos requeridos para verificar tu propiedad. Los archivos se guardan de forma segura.')}
                </div>
                {DOCS_CONFIG.map(doc => (
                  <div key={doc.key} style={{ marginBottom: 14, padding: '12px 14px', border: '1px solid ' + (docErrors[doc.key] ? '#F7C1C1' : 'var(--border)'), borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t(doc.label_en, doc.label_es)}</div>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: doc.required ? '#FAEEDA' : '#F0F0F0', color: doc.required ? '#633806' : '#666' }}>
                        {doc.required ? t('Required', 'Requerido') : t('Optional', 'Opcional')}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>JPG, PNG o PDF. Máx 10MB.</div>
                    {form[doc.key + '_url'] ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#0F6E56' }}>✅ {t('Uploaded', 'Subido')}</span>
                        <button onClick={() => update(doc.key + '_url', '')} style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          ✕ {t('Remove', 'Quitar')}
                        </button>
                      </div>
                    ) : (
                      <label style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer', background: 'var(--surface)' }}>
                        {docUploading[doc.key] ? '⏳ ' + t('Uploading...', 'Subiendo...') : '📎 ' + t('Choose file', 'Elegir archivo')}
                        <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => uploadPropertyDoc(e.target.files[0], doc.key)} />
                      </label>
                    )}
                    {docErrors[doc.key] && <div style={{ fontSize: 11, color: '#E53935', marginTop: 4 }}>⚠️ {t('Upload error. Try again.', 'Error al subir. Intenta de nuevo.')}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* STEP 6 — Photos */}
            {step === 6 && (
              <div className="card">
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  📸 {t('Property photos', 'Fotos de la propiedad')}
                </div>
                <ImageUploader
                  propertyId={editing || 'new-property'}
                  lang={lang}
                  onUploadComplete={(urls) => update('images', urls)}
                />
                {form.images?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{t('Current photos:', 'Fotos actuales:')} {form.images.length}</div>
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

                {saveMsg && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 16, background: saveMsg.type === 'success' ? 'var(--brand-light)' : '#FCEBEB', color: saveMsg.type === 'success' ? 'var(--brand-dark)' : '#A32D2D', border: '1px solid ' + (saveMsg.type === 'success' ? '#9FE1CB' : '#F7C1C1') }}>
                    {saveMsg.text}
                  </div>
                )}

                <div style={{ background: '#E6F1FB', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#185FA5', marginTop: 16 }}>
                  ℹ️ {t('Your property will be reviewed before going live. This takes 24-48 hours.', 'Tu propiedad será revisada antes de publicarse. Esto tarda 24-48 horas.')}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <button onClick={step === 1 ? () => setView('list') : prevStep} className="btn-secondary">
                {step === 1 ? t('Cancel', 'Cancelar') : '← ' + t('Back', 'Atrás')}
              </button>
              {step < STEPS.length ? (
                <button onClick={nextStep} className="btn-primary">
                  {t('Continue', 'Continuar')} →
                </button>
              ) : (
                <button onClick={handleSave} className="btn-primary" disabled={saving}>
                  {saving ? '⏳ ' + t('Saving...', 'Guardando...') : '💾 ' + t('Save property', 'Guardar propiedad')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
