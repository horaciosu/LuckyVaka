import { useState } from 'react'
import Navbar from '../components/Navbar'
import Link from 'next/link'

const STEPS = [
  { id: 1, label: 'Personal info', label_es: 'Datos personales', icon: '👤' },
  { id: 2, label: 'Fiscal & banking', label_es: 'Fiscal y banco', icon: '🏦' },
  { id: 3, label: 'Property info', label_es: 'Tu propiedad', icon: '🏡' },
  { id: 4, label: 'Review & send', label_es: 'Revisar y enviar', icon: '✅' },
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

export default function HostRegister({ lang, setLang }) {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    // Step 1 — Personal
    full_name: '',
    email: '',
    phone: '',
    country: 'México',
    nationality: 'Mexicana',
    id_type: 'INE',
    // Step 2 — Fiscal & banking
    rfc: '',
    tax_id: '',
    bank_name: '',
    clabe: '',
    account_holder: '',
    // Step 3 — Property
    property_name: '',
    property_type: '',
    address: '',
    city: '',
    state: '',
    country_prop: 'México',
    beds: '',
    baths: '',
    guests: '',
    amenities: [],
    description_es: '',
    description_en: '',
    house_rules: '',
    has_insurance: false,
    has_deed: false,
    notes: '',
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleAmenity = (a) => {
    const list = form.amenities.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...form.amenities, a]
    update('amenities', list)
  }

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
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (validateStep(step)) setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) { setStep(3); return }
    setSending(true)

    // Build email body
    const body = `
NUEVO ANFITRIÓN REGISTRADO — Lucky Vaka
========================================

DATOS PERSONALES
----------------
Nombre: ${form.full_name}
Email: ${form.email}
Teléfono: ${form.phone}
País: ${form.country}
Nacionalidad: ${form.nationality}
Tipo de ID: ${form.id_type}

DATOS FISCALES Y BANCARIOS
---------------------------
RFC / Tax ID: ${form.rfc || form.tax_id || 'No proporcionado'}
Banco: ${form.bank_name}
CLABE / Cuenta: ${form.clabe}
Titular de cuenta: ${form.account_holder}

INFORMACIÓN DE LA PROPIEDAD
----------------------------
Nombre: ${form.property_name}
Tipo: ${form.property_type}
Dirección: ${form.address}
Ciudad: ${form.city}, ${form.state}
País: ${form.country_prop}
Habitaciones: ${form.beds} | Baños: ${form.baths} | Huéspedes: ${form.guests}
Amenidades: ${form.amenities.join(', ')}

Descripción (ES): ${form.description_es}
Descripción (EN): ${form.description_en}
Reglas de la casa: ${form.house_rules}

¿Tiene seguro? ${form.has_insurance ? 'SÍ' : 'NO'}
¿Tiene escrituras? ${form.has_deed ? 'SÍ' : 'NO'}

Notas adicionales: ${form.notes || 'Ninguna'}

========================================
Enviado desde luckyvaka.com
    `.trim()

    try {
      await fetch('/api/register-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, name: form.full_name, email: form.email }),
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
    }
    setSending(false)
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

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar lang={lang} setLang={setLang} />
        <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
            {t('Application received!', '¡Solicitud recibida!')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
            {t(
              'We received your registration. Our team will review your information and contact you at ',
              'Recibimos tu solicitud. Nuestro equipo revisará tu información y te contactará a '
            )}
            <strong>{form.email}</strong>
            {t(' within 48 hours.', ' en menos de 48 horas.')}
          </p>
          <div style={{ background: 'var(--brand-light)', borderRadius: 10, padding: '14px 16px', marginBottom: 24, textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: 'var(--brand-dark)', lineHeight: 2 }}>
              <div>📧 {t('Check your email for confirmation', 'Revisa tu email para confirmación')}</div>
              <div>📄 {t('Send your ID and deed to', 'Envía tu INE/pasaporte y escrituras a')} <strong>luckyvaka.hola@gmail.com</strong></div>
              <div>⏱ {t('Approval in 24-48 hrs', 'Aprobación en 24-48 hrs')}</div>
            </div>
          </div>
          <Link href="/" className="btn-primary">{t('Back to home', 'Volver al inicio')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            {t('Become a host', 'Registra tu propiedad')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            {t('List your property on Lucky Vaka and start earning.', 'Publica tu propiedad en Lucky Vaka y empieza a ganar.')}
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: step > s.id ? 14 : 12, fontWeight: 600,
                  background: step > s.id ? 'var(--brand)' : step === s.id ? 'var(--brand)' : 'var(--bg)',
                  color: step >= s.id ? '#fff' : 'var(--muted)',
                  border: step >= s.id ? 'none' : '1px solid var(--border)',
                  marginBottom: 4,
                }}>
                  {step > s.id ? '✓' : s.icon}
                </div>
                <div style={{ fontSize: 10, color: step === s.id ? 'var(--brand)' : 'var(--muted)', textAlign: 'center', lineHeight: 1.3 }}>
                  {lang === 'es' ? s.label_es : s.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ height: 1, width: 20, background: step > s.id ? 'var(--brand)' : 'var(--border)', flexShrink: 0, marginBottom: 18 }} />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              👤 {t('Personal information', 'Información personal')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Full name', 'Nombre completo')} *</label>
                <input {...inp('full_name')} placeholder="Horacio Soria" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Email *</label>
                <input {...inp('email')} type="email" placeholder="tu@email.com" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Phone', 'Teléfono')} *</label>
                <input {...inp('phone')} placeholder="+52 662 000 0000" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Country', 'País')}</label>
                <select value={form.country} onChange={e => update('country', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                  <option>México</option>
                  <option>United States</option>
                  <option>Other / Otro</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Nationality', 'Nacionalidad')}</label>
                <input {...inp('nationality')} placeholder="Mexicana" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('ID type', 'Tipo de identificación')}</label>
                <select value={form.id_type} onChange={e => update('id_type', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                  <option>INE</option>
                  <option>Pasaporte mexicano</option>
                  <option>Passport (foreign)</option>
                  <option>Driver's license</option>
                </select>
              </div>
            </div>
            <div style={{ background: '#E6F1FB', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#185FA5', marginTop: 8 }}>
              📎 {t('Please send a copy of your ID to luckyvaka.hola@gmail.com after submitting this form.', 'Por favor envía una copia de tu identificación a luckyvaka.hola@gmail.com después de enviar este formulario.')}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              🏦 {t('Fiscal & banking information', 'Información fiscal y bancaria')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  {form.country === 'México' ? 'RFC (Hacienda)' : 'Tax ID / EIN'}
                </label>
                <input
                  value={form.country === 'México' ? form.rfc : form.tax_id}
                  onChange={e => update(form.country === 'México' ? 'rfc' : 'tax_id', e.target.value)}
                  placeholder={form.country === 'México' ? 'SOHA800101XXX' : '12-3456789'}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Bank name', 'Nombre del banco')} *</label>
                <input {...inp('bank_name')} placeholder="BBVA, Santander, Chase..." />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                {form.country === 'México' ? 'CLABE interbancaria *' : 'Account / Routing number *'}
              </label>
              <input {...inp('clabe')} placeholder={form.country === 'México' ? '012 180 0012345678 90' : 'Account number'} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Account holder name', 'Nombre del titular de la cuenta')} *</label>
              <input {...inp('account_holder')} placeholder="Horacio Soria Uribe" />
            </div>
            <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#633806', marginTop: 8 }}>
              ⚠️ {t('Banking info is kept confidential and used only for payouts.', 'La información bancaria es confidencial y se usa únicamente para pagos.')}
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              🏡 {t('Property information', 'Información de la propiedad')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Property name', 'Nombre de la propiedad')} *</label>
                <input {...inp('property_name')} placeholder="Casa de playa San Carlos" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Property type', 'Tipo de propiedad')} *</label>
                <select value={form.property_type} onChange={e => { update('property_type', e.target.value); setErrors(er => ({ ...er, property_type: false })) }}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${errors.property_type ? '#E24B4A' : 'var(--border)'}`, borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                  <option value="">{t('Select...', 'Selecciona...')}</option>
                  {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Full address', 'Dirección completa')} *</label>
              <input {...inp('address')} placeholder="Calle Mar de Cortés 123, Col. Centro" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('City', 'Ciudad')} *</label>
                <input {...inp('city')} placeholder="San Carlos" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('State', 'Estado')}</label>
                <input {...inp('state')} placeholder="Sonora" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Country', 'País')}</label>
                <select value={form.country_prop} onChange={e => update('country_prop', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}>
                  <option>México</option>
                  <option>United States</option>
                  <option>Other / Otro</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              {[['beds', t('Bedrooms','Habitaciones')], ['baths', t('Bathrooms','Baños')], ['guests', t('Max guests','Huéspedes máx')]].map(([f, label]) => (
                <div key={f}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input type="number" min={1} {...inp(f)} placeholder="2" />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>{t('Amenities', 'Amenidades')}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {AMENITIES_LIST.map(a => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)} style={{
                    padding: '5px 11px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                    border: '1px solid',
                    borderColor: form.amenities.includes(a) ? 'var(--brand)' : 'var(--border)',
                    background: form.amenities.includes(a) ? 'var(--brand-light)' : 'transparent',
                    color: form.amenities.includes(a) ? 'var(--brand-dark)' : 'var(--muted)',
                  }}>{a}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Description (Spanish)', 'Descripción en español')}</label>
              <textarea {...inp('description_es')} rows={3} placeholder="Describe tu propiedad..." style={{ ...inp('description_es').style, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Description (English)', 'Descripción en inglés')}</label>
              <textarea {...inp('description_en')} rows={3} placeholder="Describe your property..." style={{ ...inp('description_en').style, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('House rules', 'Reglas de la casa')}</label>
              <textarea {...inp('house_rules')} rows={2} placeholder={t('No smoking, no parties...', 'No fumar, no fiestas...')} style={{ ...inp('house_rules').style, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.has_insurance} onChange={e => update('has_insurance', e.target.checked)} />
                {t('Property has insurance', 'La propiedad tiene seguro')}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.has_deed} onChange={e => update('has_deed', e.target.checked)} />
                {t('I have property deed / title', 'Tengo escrituras o título')}
              </label>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Additional notes', 'Notas adicionales')}</label>
              <textarea {...inp('notes')} rows={2} placeholder={t('Anything else we should know...', 'Algo más que debamos saber...')} style={{ ...inp('notes').style, resize: 'vertical' }} />
            </div>
          </div>
        )}

        {/* STEP 4 — Review */}
        {step === 4 && (
          <div>
            {/* Folio number */}
            <div className="card" style={{ marginBottom: 14, background: 'var(--brand-light)', border: '1px solid #9FE1CB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-dark)', marginBottom: 2 }}>
                    🔖 {t('Your application folio', 'Folio de tu solicitud')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--brand-dark)', opacity: 0.8 }}>
                    {t('Include this number in your email subject when sending documents.', 'Incluye este número en el asunto de tu email al enviar documentos.')}
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
                  color: 'var(--brand-dark)', background: '#fff',
                  padding: '8px 16px', borderRadius: 8, border: '1px solid #9FE1CB',
                  letterSpacing: 2,
                }}>
                  LV-{form.full_name.replace(/\s/g,'').substring(0,3).toUpperCase() || 'XXX'}-{Date.now().toString().slice(-5)}
                </div>
              </div>
            </div>

            {/* Data summary */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                ✅ {t('Review your application', 'Revisa tu solicitud')}
              </div>
              {[
                ['👤 ' + t('Personal', 'Personal'), [
                  [t('Name', 'Nombre'), form.full_name],
                  ['Email', form.email],
                  [t('Phone', 'Teléfono'), form.phone],
                  [t('Country', 'País'), form.country],
                  ['ID', form.id_type],
                ]],
                ['🏦 ' + t('Fiscal & banking', 'Fiscal y banco'), [
                  ['RFC / Tax ID', form.rfc || form.tax_id || '—'],
                  [t('Bank', 'Banco'), form.bank_name],
                  ['CLABE', form.clabe],
                  [t('Holder', 'Titular'), form.account_holder],
                ]],
                ['🏡 ' + t('Property', 'Propiedad'), [
                  [t('Name', 'Nombre'), form.property_name],
                  [t('Type', 'Tipo'), form.property_type],
                  [t('Address', 'Dirección'), form.address],
                  [t('City', 'Ciudad'), `${form.city}, ${form.state}, ${form.country_prop}`],
                  [t('Beds/Baths/Guests', 'Hab/Baños/Huéspedes'), `${form.beds} / ${form.baths} / ${form.guests}`],
                  [t('Amenities', 'Amenidades'), form.amenities.join(', ') || '—'],
                  [t('Insurance', 'Seguro'), form.has_insurance ? '✓' : '✗'],
                  [t('Deed', 'Escrituras'), form.has_deed ? '✓' : '✗'],
                ]],
              ].map(([section, rows]) => (
                <div key={section} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{section}</div>
                  {rows.map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                      <span>{k}</span>
                      <span style={{ color: 'var(--text)', maxWidth: '60%', textAlign: 'right' }}>{v || '—'}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Document checklist */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                📎 {t('Required documents — send by email', 'Documentos requeridos — enviar por email')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
                {t(
                  'After submitting this form, send the following documents to verify your identity and property ownership:',
                  'Después de enviar este formulario, manda los siguientes documentos para verificar tu identidad y propiedad:'
                )}
              </div>
              {[
                { icon: '🪪', label: t('Official ID — both sides (INE, passport or driver\'s license)', 'Identificación oficial — ambos lados (INE, pasaporte o licencia)'), required: true },
                { icon: '🏠', label: t('Property deed or title / Escrituras o título de propiedad', 'Escrituras o título de propiedad'), required: true },
                { icon: '📋', label: t('Tax registration / Constancia de situación fiscal (RFC)', 'Constancia de situación fiscal (RFC)'), required: form.country === 'México' },
                { icon: '🛡', label: t('Property insurance policy (if available)', 'Póliza de seguro de la propiedad (si aplica)'), required: false },
                { icon: '📸', label: t('Additional property photos (optional)', 'Fotos adicionales de la propiedad (opcional)'), required: false },
              ].map((doc, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{doc.icon}</span>
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                    {doc.label}
                  </div>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                    background: doc.required ? '#FCEBEB' : 'var(--bg)',
                    color: doc.required ? '#A32D2D' : 'var(--muted)',
                    border: `1px solid ${doc.required ? '#F7C1C1' : 'var(--border)'}`,
                  }}>
                    {doc.required ? t('Required', 'Requerido') : t('Optional', 'Opcional')}
                  </span>
                </div>
              ))}

              {/* Email button */}
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                  {t('Send documents to:', 'Envía los documentos a:')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    luckyvaka.hola@gmail.com
                  </div>
                  <a
                    href={`mailto:luckyvaka.hola@gmail.com?subject=Documentos anfitrión LV-${form.full_name.replace(/\s/g,'').substring(0,3).toUpperCase() || 'XXX'}-${Date.now().toString().slice(-5)}&body=Hola equipo Lucky Vaka,%0A%0AAdjunto mis documentos para verificación.%0A%0ANombre: ${form.full_name}%0APropiedad: ${form.property_name}%0A%0ASaludos`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: 'var(--brand)', color: '#fff',
                      padding: '7px 14px', borderRadius: 8, fontSize: 12,
                      textDecoration: 'none', fontWeight: 500,
                    }}
                  >
                    📧 {t('Open email', 'Abrir email')}
                  </a>
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
                  {t('The subject line is pre-filled with your folio number so we can match your documents.', 'El asunto viene prellenado con tu número de folio para que podamos vincular tus documentos.')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary">
              ← {t('Back', 'Regresar')}
            </button>
          ) : <div />}

          {step < 4 ? (
            <button onClick={next} className="btn-primary">
              {t('Continue', 'Continuar')} →
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary" disabled={sending}>
              {sending ? '⏳ ' + t('Sending...', 'Enviando...') : '🚀 ' + t('Submit application', 'Enviar solicitud')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
