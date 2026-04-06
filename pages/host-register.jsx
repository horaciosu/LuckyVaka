import { useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'

const STEPS = [
  { id: 1, label: 'Personal info',     label_es: 'Datos personales', icon: '👤' },
  { id: 2, label: 'Fiscal & banking',  label_es: 'Fiscal y banco',   icon: '🏦' },
  { id: 3, label: 'Property info',     label_es: 'Tu propiedad',     icon: '🏡' },
  { id: 4, label: 'Documents',         label_es: 'Documentos',       icon: '📎' },
  { id: 5, label: 'Review & send',     label_es: 'Revisar y enviar', icon: '✅' },
]

const PROPERTY_TYPES = [
  'Casa / House', 'Departamento / Apartment', 'Cabaña / Cabin',
  'Villa', 'Rancho / Ranch', 'Hotel / Boutique hotel',
  'Yate / Yacht', 'Isla privada / Private island', 'Otro / Other',
]

const AMENITIES_LIST = [
  'Wi-Fi', 'A/C', 'Alberca / Pool', 'Estacionamiento / Parking',
  'Cocina equipada / Full kitchen', 'Lavadora / Washer',
  'Smart TV', 'Vista al mar / Ocean view', 'Acceso a playa / Beach access',
  'Asador / BBQ', 'Jacuzzi', 'Gimnasio / Gym',
  'Seguridad / Security', 'Mascotas / Pet friendly',
]

const DOCS_CONFIG = [
  {
    key: 'id_doc',
    icon: '🪪',
    label_en: 'Official ID — both sides (INE, passport or driver\'s license)',
    label_es: 'Identificación oficial — ambos lados (INE, pasaporte o licencia)',
    required: true,
    accept: 'image/*,.pdf',
    hint_es: 'JPG, PNG o PDF. Máx 10MB.',
    hint_en: 'JPG, PNG or PDF. Max 10MB.',
  },
  {
    key: 'deed_doc',
    icon: '🏠',
    label_en: 'Property deed or title',
    label_es: 'Escrituras o título de propiedad',
    required: true,
    accept: 'image/*,.pdf',
    hint_es: 'JPG, PNG o PDF. Máx 10MB.',
    hint_en: 'JPG, PNG or PDF. Max 10MB.',
  },
  {
    key: 'tax_doc',
    icon: '📋',
    label_en: 'Tax registration / Constancia de situación fiscal (RFC)',
    label_es: 'Constancia de situación fiscal (RFC)',
    required: true,
    accept: 'image/*,.pdf',
    hint_es: 'JPG, PNG o PDF. Máx 10MB.',
    hint_en: 'JPG, PNG or PDF. Max 10MB.',
  },
  {
    key: 'insurance_doc',
    icon: '🛡',
    label_en: 'Property insurance policy',
    label_es: 'Póliza de seguro de la propiedad',
    required: false,
    accept: 'image/*,.pdf',
    hint_es: 'Opcional. JPG, PNG o PDF. Máx 10MB.',
    hint_en: 'Optional. JPG, PNG or PDF. Max 10MB.',
  },
  {
    key: 'photos',
    icon: '📸',
    label_en: 'Additional property photos',
    label_es: 'Fotos adicionales de la propiedad',
    required: false,
    accept: 'image/*',
    multiple: true,
    hint_es: 'Opcional. Máx 5 fotos, 10MB cada una.',
    hint_en: 'Optional. Max 5 photos, 10MB each.',
  },
]

export default function HostRegister({ lang, setLang }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploadedFiles, setUploadedFiles] = useState({})
  const [uploadErrors, setUploadErrors] = useState({})
  const fileRefs = useRef({})


  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', country: 'México',
    nationality: 'Mexicana', id_type: 'INE',
    rfc: '', tax_id: '', bank_name: '', clabe: '', account_holder: '',
    property_name: '', property_type: '', address: '', city: '',
    state: '', country_prop: 'México', beds: '', baths: '', guests: '',
    amenities: [], description_es: '', description_en: '',
    house_rules: '', has_insurance: false, has_deed: false, notes: '',
  })

  // Folio estable basado en nombre
  const getFolio = () => {
    const prefix = form.full_name.replace(/\s/g,'').substring(0,3).toUpperCase() || 'XXX'
    if (!getFolio._cached) getFolio._cached = Date.now().toString().slice(-5)
    return `LV-${prefix}-${getFolio._cached}`
  }

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleAmenity = (a) => {
    const list = form.amenities.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...form.amenities, a]
    update('amenities', list)
  }

  const t = (en, es) => lang === 'es' ? es : en

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

  const validateStep = (s) => {
    const e = {}
    if (s === 1) {
      if (!form.full_name.trim()) e.full_name = true
      if (!form.email.includes('@')) e.email = true
      if (!form.phone.trim()) e.phone = true
    }
    if (s === 2) {
      if (!form.bank_name.trim()) e.bank_name = true
      if (!form.clabe.trim()) e.clabe = true
      if (!form.account_holder.trim()) e.account_holder = true
    }
    if (s === 3) {
      if (!form.property_name.trim()) e.property_name = true
      if (!form.property_type) e.property_type = true
      if (!form.address.trim()) e.address = true
      if (!form.city.trim()) e.city = true
    }
    if (s === 4) {
      // Verificar documentos requeridos
      const requiredDocs = DOCS_CONFIG.filter(d => d.required)
      requiredDocs.forEach(doc => {
        if (!uploadedFiles[doc.key]) e[doc.key] = true
      })
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (validateStep(step)) setStep(s => s + 1)
  }

  // Upload de archivo a Supabase Storage
  const handleFileUpload = async (docKey, files) => {
    if (!files || files.length === 0) return

    const folioCode = getFolio()
    setUploadProgress(p => ({ ...p, [docKey]: 'uploading' }))
    setUploadErrors(e => ({ ...e, [docKey]: null }))

    try {
      const uploaded = []
      for (const file of Array.from(files)) {
        // Validar tamaño (10MB)
        if (file.size > 10 * 1024 * 1024) {
          setUploadErrors(e => ({ ...e, [docKey]: t('File too large. Max 10MB.', 'Archivo muy grande. Máx 10MB.') }))
          setUploadProgress(p => ({ ...p, [docKey]: 'error' }))
          return
        }

        const ext = file.name.split('.').pop()
        const fileName = `${folioCode}/${docKey}_${Date.now()}.${ext}`

        const { data, error } = await supabase.storage
          .from('host-documents')
          .upload(fileName, file, { upsert: true })

        if (error) throw error

        // Obtener URL pública (firmada para bucket privado)
        const { data: urlData } = await supabase.storage
          .from('host-documents')
          .createSignedUrl(fileName, 60 * 60 * 24 * 7) // 7 días

        uploaded.push({
          name: file.name,
          path: fileName,
          url: urlData?.signedUrl || '',
          size: file.size,
        })
      }

      setUploadedFiles(f => ({ ...f, [docKey]: uploaded }))
      setUploadProgress(p => ({ ...p, [docKey]: 'done' }))
      setErrors(e => ({ ...e, [docKey]: false }))
    } catch (err) {
      console.error('Upload error:', err)
      setUploadErrors(e => ({ ...e, [docKey]: t('Upload failed. Try again.', 'Error al subir. Intenta de nuevo.') }))
      setUploadProgress(p => ({ ...p, [docKey]: 'error' }))
    }
  }

  const removeFile = async (docKey) => {
    const files = uploadedFiles[docKey]
    if (!files) return
    // Eliminar de Storage
    for (const f of files) {
      await supabase.storage.from('host-documents').remove([f.path])
    }
    setUploadedFiles(f => { const n = { ...f }; delete n[docKey]; return n })
    setUploadProgress(p => { const n = { ...p }; delete n[docKey]; return n })
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) { setStep(4); return }
    setSending(true)

    try {
      const folioCode = getFolio()

      // Guardar en tabla host_applications
      const docsMap = {}
      Object.entries(uploadedFiles).forEach(([key, files]) => {
        docsMap[key] = files.map(f => ({ name: f.name, path: f.path, url: f.url }))
      })

      const { error: dbError } = await supabase
        .from('host_applications')
        .insert({
          folio: folioCode,
          user_id: user?.id || null,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          country: form.country,
          rfc: form.rfc || form.tax_id,
          bank_name: form.bank_name,
          clabe: form.clabe,
          account_holder: form.account_holder,
          property_name: form.property_name,
          property_type: form.property_type,
          address: form.address,
          city: form.city,
          state: form.state,
          country_prop: form.country_prop,
          beds: parseInt(form.beds) || null,
          baths: parseInt(form.baths) || null,
          guests: parseInt(form.guests) || null,
          amenities: form.amenities,
          description_es: form.description_es,
          description_en: form.description_en,
          house_rules: form.house_rules,
          has_insurance: form.has_insurance,
          has_deed: form.has_deed,
          notes: form.notes,
          documents: docsMap,
          status: 'pending',
        })

      if (dbError) throw dbError

      // Enviar email de notificación
      await fetch('/api/register-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.full_name,
          email: form.email,
          folio: folioCode,
          body: `Nuevo anfitrión: ${form.full_name} | ${form.email} | Folio: ${folioCode} | Propiedad: ${form.property_name}`,
        }),
      })

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setErrors({ submit: t('Error submitting. Please try again.', 'Error al enviar. Intenta de nuevo.') })
    }
    setSending(false)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar lang={lang} setLang={setLang} />
        <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
            {t('Application submitted!', '¡Solicitud enviada!')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 8 }}>
            {t(
              'We received your application and documents. Our team will review everything and contact you within 2-3 business days.',
              'Recibimos tu solicitud y documentos. Nuestro equipo revisará todo y te contactará en 2-3 días hábiles.'
            )}
          </p>
          <div style={{ background: 'var(--brand-light)', borderRadius: 10, padding: '12px 20px', marginBottom: 24, display: 'inline-block' }}>
            <div style={{ fontSize: 11, color: 'var(--brand-dark)', marginBottom: 4 }}>{t('Your folio', 'Tu folio')}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--brand-dark)', letterSpacing: 2 }}>
              {getFolio()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/" className="btn-primary">{t('Go home', 'Ir al inicio')}</Link>
            <Link href="/host" className="btn-secondary">{t('My dashboard', 'Mi dashboard')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            {t('Host registration', 'Registro de anfitrión')}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            {t('List your property and start earning', 'Registra tu propiedad y empieza a ganar')}
          </p>
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: step > s.id ? 16 : 14, fontWeight: 600,
                  background: step > s.id ? 'var(--brand)' : step === s.id ? 'var(--brand)' : 'var(--bg)',
                  color: step >= s.id ? '#fff' : 'var(--muted)',
                  border: step >= s.id ? 'none' : '1px solid var(--border)',
                }}>
                  {step > s.id ? '✓' : s.icon}
                </div>
                <div style={{ fontSize: 10, color: step === s.id ? 'var(--brand)' : 'var(--muted)', textAlign: 'center', lineHeight: 1.3, maxWidth: 60 }}>
                  {lang === 'es' ? s.label_es : s.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ height: 1, width: 32, background: step > s.id ? 'var(--brand)' : 'var(--border)', margin: '0 4px', marginBottom: 20, flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

        <div className="card">

          {/* STEP 1 — Personal */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
                👤 {t('Personal information', 'Datos personales')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Full name', 'Nombre completo')} *</label>
                  <input {...inp('full_name')} placeholder="Horacio Soria" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Email *</label>
                  <input {...inp('email')} type="email" placeholder="tu@email.com" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Phone', 'Teléfono')} *</label>
                  <input {...inp('phone')} placeholder="+52 664 000 0000" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Country', 'País')}</label>
                  <input {...inp('country')} placeholder="México" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Nationality', 'Nacionalidad')}</label>
                  <input {...inp('nationality')} placeholder="Mexicana" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('ID type', 'Tipo de ID')}</label>
                  <select value={form.id_type} onChange={e => update('id_type', e.target.value)} style={{ ...inp('id_type').style }}>
                    <option value="INE">INE</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Licencia">Licencia de conducir</option>
                    <option value="Other">Otro</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Fiscal & banking */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
                🏦 {t('Fiscal & banking information', 'Datos fiscales y bancarios')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>RFC</label>
                  <input {...inp('rfc')} placeholder="SOHO800101AAA" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Bank', 'Banco')} *</label>
                  <input {...inp('bank_name')} placeholder="BBVA, Banamex..." />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>CLABE *</label>
                  <input {...inp('clabe')} placeholder="012180001234567890" maxLength={18} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Account holder', 'Titular de la cuenta')} *</label>
                  <input {...inp('account_holder')} placeholder="Nombre como aparece en el banco" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Property */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
                🏡 {t('Property information', 'Información de la propiedad')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Property name', 'Nombre de la propiedad')} *</label>
                  <input {...inp('property_name')} placeholder="Casa Azul — Mazatlán" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Property type', 'Tipo de propiedad')} *</label>
                  <select value={form.property_type} onChange={e => { update('property_type', e.target.value); setErrors(er => ({ ...er, property_type: false })) }}
                    style={{ ...inp('property_type').style }}>
                    <option value="">{t('Select type...', 'Selecciona tipo...')}</option>
                    {PROPERTY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Address', 'Dirección')} *</label>
                  <input {...inp('address')} placeholder="Calle, número, colonia" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('City', 'Ciudad')} *</label>
                  <input {...inp('city')} placeholder="Mazatlán" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('State', 'Estado')}</label>
                  <input {...inp('state')} placeholder="Sinaloa" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Bedrooms', 'Habitaciones')}</label>
                  <input {...inp('beds')} type="number" min="1" placeholder="3" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Bathrooms', 'Baños')}</label>
                  <input {...inp('baths')} type="number" min="1" placeholder="2" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Max guests', 'Máx huéspedes')}</label>
                  <input {...inp('guests')} type="number" min="1" placeholder="6" />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>{t('Amenities', 'Amenidades')}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {AMENITIES_LIST.map(a => (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)} style={{
                      fontSize: 11, padding: '5px 10px', borderRadius: 20, cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: form.amenities.includes(a) ? 'var(--brand)' : 'transparent',
                      color: form.amenities.includes(a) ? '#fff' : 'var(--muted)',
                    }}>{a}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Description (Spanish)', 'Descripción (Español)')}</label>
                <textarea {...inp('description_es')} rows={3} placeholder={t('Describe your property...', 'Describe tu propiedad...')} style={{ ...inp('description_es').style, resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Description (English)', 'Descripción (Inglés)')}</label>
                <textarea {...inp('description_en')} rows={3} placeholder="Describe your property in English..." style={{ ...inp('description_en').style, resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('House rules', 'Reglas de la casa')}</label>
                <textarea {...inp('house_rules')} rows={2} placeholder={t('No smoking, no parties...', 'No fumar, no fiestas...')} style={{ ...inp('house_rules').style, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.has_insurance} onChange={e => update('has_insurance', e.target.checked)} />
                  {t('Property has insurance', 'La propiedad tiene seguro')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.has_deed} onChange={e => update('has_deed', e.target.checked)} />
                  {t('I have property deed', 'Tengo escrituras')}
                </label>
              </div>
            </div>
          )}

          {/* STEP 4 — Documents upload */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                📎 {t('Upload your documents', 'Sube tus documentos')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
                {t(
                  'Upload the following documents to verify your identity and property. Files are stored securely.',
                  'Sube los siguientes documentos para verificar tu identidad y propiedad. Los archivos se guardan de forma segura.'
                )}
              </div>

              {DOCS_CONFIG.map((doc, i) => {
                const status = uploadProgress[doc.key]
                const files = uploadedFiles[doc.key]
                const hasError = errors[doc.key] || uploadErrors[doc.key]

                return (
                  <div key={doc.key} style={{
                    marginBottom: 14, padding: 14, borderRadius: 10,
                    border: `1px solid ${hasError ? '#E24B4A' : files ? '#9FE1CB' : 'var(--border)'}`,
                    background: files ? 'var(--brand-light)' : 'var(--surface)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{doc.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
                            {lang === 'es' ? doc.label_es : doc.label_en}
                          </div>
                          <span style={{
                            fontSize: 10, padding: '2px 7px', borderRadius: 10, flexShrink: 0, marginLeft: 8,
                            background: doc.required ? '#FCEBEB' : 'var(--bg)',
                            color: doc.required ? '#A32D2D' : 'var(--muted)',
                            border: `1px solid ${doc.required ? '#F7C1C1' : 'var(--border)'}`,
                          }}>
                            {doc.required ? t('Required', 'Requerido') : t('Optional', 'Opcional')}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                          {lang === 'es' ? doc.hint_es : doc.hint_en}
                        </div>

                        {/* Archivo ya subido */}
                        {files ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: 'var(--brand-dark)', fontWeight: 500 }}>
                              ✅ {files.map(f => f.name).join(', ')}
                            </span>
                            <button onClick={() => removeFile(doc.key)} style={{
                              fontSize: 11, color: '#A32D2D', background: 'none', border: 'none',
                              cursor: 'pointer', padding: 0, textDecoration: 'underline',
                            }}>
                              {t('Remove', 'Quitar')}
                            </button>
                          </div>
                        ) : status === 'uploading' ? (
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            ⏳ {t('Uploading...', 'Subiendo...')}
                          </div>
                        ) : (
                          <div>
                            <input
                              ref={el => fileRefs.current[doc.key] = el}
                              type="file"
                              accept={doc.accept}
                              multiple={doc.multiple || false}
                              style={{ display: 'none' }}
                              onChange={e => handleFileUpload(doc.key, e.target.files)}
                            />
                            <button
                              onClick={() => fileRefs.current[doc.key]?.click()}
                              style={{
                                fontSize: 12, padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                                border: `1px solid ${hasError ? '#E24B4A' : 'var(--border)'}`,
                                background: 'transparent', color: hasError ? '#A32D2D' : 'var(--text)',
                                display: 'flex', alignItems: 'center', gap: 6,
                              }}
                            >
                              📁 {t('Choose file', 'Elegir archivo')}
                            </button>
                          </div>
                        )}

                        {uploadErrors[doc.key] && (
                          <div style={{ fontSize: 11, color: '#A32D2D', marginTop: 4 }}>⚠️ {uploadErrors[doc.key]}</div>
                        )}
                        {errors[doc.key] && !files && (
                          <div style={{ fontSize: 11, color: '#A32D2D', marginTop: 4 }}>
                            ⚠️ {t('This document is required', 'Este documento es requerido')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* STEP 5 — Review */}
          {step === 5 && (
            <div>
              <div style={{ marginBottom: 14, background: 'var(--brand-light)', border: '1px solid #9FE1CB', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-dark)', marginBottom: 2 }}>
                      🔖 {t('Your application folio', 'Folio de tu solicitud')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--brand-dark)', opacity: 0.8 }}>
                      {t('Save this number for future reference.', 'Guarda este número para referencia futura.')}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
                    color: 'var(--brand-dark)', background: '#fff',
                    padding: '8px 16px', borderRadius: 8, border: '1px solid #9FE1CB', letterSpacing: 2,
                  }}>
                    {getFolio()}
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  ✅ {t('Review your application', 'Revisa tu solicitud')}
                </div>
                {[
                  ['👤 ' + t('Personal', 'Personal'), [
                    [t('Name', 'Nombre'), form.full_name],
                    ['Email', form.email],
                    [t('Phone', 'Teléfono'), form.phone],
                    ['ID', form.id_type],
                  ]],
                  ['🏦 ' + t('Banking', 'Bancario'), [
                    ['RFC', form.rfc || '—'],
                    [t('Bank', 'Banco'), form.bank_name],
                    ['CLABE', form.clabe],
                    [t('Holder', 'Titular'), form.account_holder],
                  ]],
                  ['🏡 ' + t('Property', 'Propiedad'), [
                    [t('Name', 'Nombre'), form.property_name],
                    [t('Type', 'Tipo'), form.property_type],
                    [t('City', 'Ciudad'), `${form.city}, ${form.state}`],
                    [t('Capacity', 'Capacidad'), `${form.beds} hab / ${form.baths} baños / ${form.guests} huéspedes`],
                    [t('Insurance', 'Seguro'), form.has_insurance ? '✓' : '✗'],
                  ]],
                  ['📎 ' + t('Documents', 'Documentos'), DOCS_CONFIG.map(d => [
                    lang === 'es' ? d.label_es.split(' —')[0] : d.label_en.split(' —')[0],
                    uploadedFiles[d.key] ? '✅ ' + t('Uploaded', 'Subido') : (d.required ? '⚠️ ' + t('Missing', 'Faltante') : '— ' + t('Not provided', 'No proporcionado')),
                  ])],
                ].map(([section, rows]) => (
                  <div key={section} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{section}</div>
                    {rows.map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                        <span>{k}</span>
                        <span style={{ color: 'var(--text)', maxWidth: '60%', textAlign: 'right' }}>{v || '—'}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {errors.submit && (
                <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#A32D2D', marginBottom: 14 }}>
                  ⚠️ {errors.submit}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary">
                ← {t('Back', 'Regresar')}
              </button>
            ) : <div />}

            {step < 5 ? (
              <button onClick={next} className="btn-primary">
                {t('Continue', 'Continuar')} →
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn-primary" disabled={sending}>
                {sending ? '⏳ ' + t('Submitting...', 'Enviando...') : '🚀 ' + t('Submit application', 'Enviar solicitud')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
