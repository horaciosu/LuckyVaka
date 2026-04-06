import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'

export default function Checkout({ lang, setLang }) {
  const router = useRouter()
  const { raffle: raffleSlug, qty, tickets } = router.query

  const ticketCount = parseInt(qty) || 1
  const selectedTickets = tickets ? tickets.split(',').filter(Boolean).map(Number) : []

  const [raffle, setRaffle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('form')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [tab, setTab] = useState('card')
  const [form, setForm] = useState({ fname: '', lname: '', email: '', card: '', expiry: '', cvv: '', name: '' })
  const [errors, setErrors] = useState({})
  const [terms, setTerms] = useState(false)

  const { user, loading: authLoading } = useAuth({ required: true, redirectTo: '/login' })
  const t = (en, es) => lang === 'es' ? es : en

  useEffect(() => {
    if (!raffleSlug) return
    supabase
      .from('raffles')
      .select('*, properties(*)')
      .eq('slug', raffleSlug)
      .single()
      .then(({ data }) => { setRaffle(data); setLoading(false) })
  }, [raffleSlug])

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const formatCard = v => v.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim()
  const formatExpiry = v => {
    const d = v.replace(/\D/g, '').substring(0, 4)
    return d.length >= 2 ? d.substring(0, 2) + ' / ' + d.substring(2) : d
  }

  const validate = () => {
    const e = {}
    if (!form.fname.trim()) e.fname = true
    if (!form.email.includes('@')) e.email = true
    if (!terms) e.terms = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePay = async () => {
    if (!validate()) return
    if (!raffle) return
    setPaying(true)
    setPayError('')

    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffle_slug: raffleSlug,
          ticket_numbers: selectedTickets,
          buyer_email: form.email,
          buyer_name: `${form.fname} ${form.lname}`.trim(),
          qty: ticketCount,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setPayError(t(
            'Some of your selected tickets were just taken. Please go back and choose different numbers.',
            'Algunos boletos que elegiste ya fueron tomados. Regresa y elige otros números.'
          ))
        } else {
          setPayError(data.error || t('Payment failed. Please try again.', 'Error al procesar el pago. Intenta de nuevo.'))
        }
        setPaying(false)
        return
      }

      // Enviar email de confirmación
      await fetch('/api/emails/confirm-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: form.email,
          clientName: form.fname,
          propertyName: raffle.properties?.name || raffleSlug,
          propertyLocation: `${raffle.properties?.city || ''}, ${raffle.properties?.country || ''}`,
          ticketNumbers: selectedTickets,
          totalPaid: total,
          currency: raffle.currency,
          raffleDate: raffle.draw_date,
          stayDate: raffle.stay_date,
          raffleId: raffle.id,
        }),
      }).catch(() => {})
      setStep('success')
    } catch (err) {
      setPayError(t('Connection error. Please try again.', 'Error de conexión. Intenta de nuevo.'))
      setPaying(false)
    }
  }

  if (authLoading) return null
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ textAlign: 'center', padding: '80px 0', fontSize: 13, color: 'var(--muted)' }}>
        ⏳ {t('Loading...', 'Cargando...')}
      </div>
    </div>
  )

  if (!raffle) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--muted)' }}>{t('Raffle not found.', 'Rifa no encontrada.')}</p>
        <Link href="/raffles" className="btn-primary">{t('Browse raffles', 'Ver rifas')}</Link>
      </div>
    </div>
  )

  const subtotal = ticketCount * raffle.ticket_price
  const fee = +(subtotal * 0.1).toFixed(2)
  const total = +(subtotal + fee).toFixed(2)
  const property = raffle.properties

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar lang={lang} setLang={setLang} />
        <div style={{ maxWidth: 520, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            {t("You're in the draw!", '¡Estás en el sorteo!')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.65 }}>
            {t(
              `Your tickets are confirmed. We'll email you the draw result on ${formatDate(raffle.draw_date)}.`,
              `Tus boletos están confirmados. Te enviaremos el resultado del sorteo el ${formatDate(raffle.draw_date)} por email.`
            )}
          </p>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            {selectedTickets.map(n => (
              <div key={n} style={{ width: 42, height: 42, borderRadius: 8, background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>{n}</div>
            ))}
          </div>

          <div className="card" style={{ textAlign: 'left', marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 2 }}>
              <div>📍 <strong>{property?.name || raffleSlug}</strong></div>
              <div>🗓 {t('Stay date:', 'Fecha de estancia:')} {formatDate(raffle.stay_date)}</div>
              <div>🎯 {t('Draw:', 'Sorteo:')} {formatDate(raffle.draw_date)}</div>
              <div>📧 {t('Confirmation sent to:', 'Confirmación enviada a:')} {form.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/dashboard" className="btn-primary">{t('View my tickets', 'Ver mis boletos')}</Link>
            <Link href="/raffles" className="btn-secondary">{t('Browse more', 'Ver más rifas')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />

      {/* Steps bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 0, padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        {[t('Browse', 'Explorar'), t('Select', 'Seleccionar'), t('Payment', 'Pago'), t('Confirm', 'Confirmación')].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, background: i < 2 ? 'var(--brand)' : i === 2 ? 'var(--brand)' : '#EEECE8', color: i <= 2 ? '#fff' : 'var(--muted)' }}>
                {i < 2 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, color: i === 2 ? 'var(--text)' : 'var(--muted)', fontWeight: i === 2 ? 500 : 400 }}>{s}</span>
            </div>
            {i < 3 && <div style={{ width: 28, height: 1, background: i < 2 ? 'var(--brand)' : 'var(--border)', margin: '0 6px' }} />}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* LEFT */}
        <div>
          {/* Contact */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              {t('Contact information', 'Información de contacto')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('First name', 'Nombre')} *</label>
                <input value={form.fname} onChange={e => update('fname', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid ${errors.fname ? '#E24B4A' : 'var(--border)'}`, borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                  placeholder="Carlos" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Last name', 'Apellido')}</label>
                <input value={form.lname} onChange={e => update('lname', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                  placeholder="Soria" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Email', 'Correo electrónico')} *</label>
              <input value={form.email} onChange={e => update('email', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: `1px solid ${errors.email ? '#E24B4A' : 'var(--border)'}`, borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                placeholder="carlos@email.com" type="email" />
              {errors.email && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 3 }}>{t('Valid email required', 'Email válido requerido')}</div>}
            </div>
          </div>

          {/* Payment */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              {t('Payment method', 'Método de pago')}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[['card', t('Card', 'Tarjeta')], ['paypal', 'PayPal'], ['spei', 'SPEI']].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: tab === id ? '1.5px solid var(--brand)' : '1px solid var(--border)', background: tab === id ? 'var(--brand-light)' : 'transparent', color: tab === id ? 'var(--brand-dark)' : 'var(--muted)' }}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'card' && (
              <>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {['VISA', 'MC', 'AMEX'].map(b => (
                    <div key={b} style={{ padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 10, color: 'var(--muted)', background: 'var(--surface)' }}>{b}</div>
                  ))}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Card number', 'Número de tarjeta')} *</label>
                  <input value={form.card} onChange={e => update('card', formatCard(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                    placeholder="1234 5678 9012 3456" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('Expiry', 'Vencimiento')} *</label>
                    <input value={form.expiry} onChange={e => update('expiry', formatExpiry(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                      placeholder="MM / YY" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>CVV *</label>
                    <input type="password" value={form.cvv} onChange={e => update('cvv', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                      placeholder="•••" maxLength={4} />
                  </div>
                </div>
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  Powered by <span style={{ background: '#635BFF', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 3, fontWeight: 600 }}>stripe</span> · End-to-end encrypted
                </div>
              </>
            )}

            {tab === 'paypal' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <button style={{ width: '100%', padding: 12, background: '#FFC439', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#003087', cursor: 'pointer' }}>
                  🅿 Pay with PayPal
                </button>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                  {t("You'll be redirected to PayPal to complete payment.", 'Serás redirigido a PayPal para completar el pago.')}
                </div>
              </div>
            )}

            {tab === 'spei' && (
              <div style={{ background: '#F4F3EF', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>{t('Transfer to:', 'Transferir a:')}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 2 }}>
                  <div><strong>Banco:</strong> BBVA México</div>
                  <div><strong>CLABE:</strong> 012 180 0012345678 90</div>
                  <div><strong>{t('Amount', 'Monto')}:</strong> ${total} {raffle.currency}</div>
                  <div><strong>{t('Reference', 'Referencia')}:</strong> LV-{raffle.id?.toUpperCase().slice(0, 8)}</div>
                </div>
                <div style={{ fontSize: 10, color: '#633806', background: '#FAEEDA', borderRadius: 4, padding: '6px 8px', marginTop: 8 }}>
                  ⚠️ {t('Tickets reserved for 2 hours. Complete transfer before expiry.', 'Tus boletos están reservados por 2 horas.')}
                </div>
              </div>
            )}
          </div>

          {/* Terms */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
            <label>
              {t(
                'I agree to the Terms & Conditions and Raffle Rules. I understand this is a chance-based purchase.',
                'Acepto los Términos y Condiciones y el Reglamento de Rifas. Entiendo que esta es una compra basada en azar.'
              )}
              {errors.terms && <span style={{ color: '#E24B4A', marginLeft: 4 }}>*</span>}
            </label>
          </div>

          {/* Error de pago */}
          {payError && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 8, fontSize: 12, color: '#A32D2D' }}>
              ⚠️ {payError}
            </div>
          )}
        </div>

        {/* RIGHT — summary */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              {t('Order summary', 'Resumen del pedido')}
            </div>

            {/* Property */}
            <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{property?.name || raffleSlug}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>📍 {property?.city}, {property?.country}</div>
              <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: 2 }}>🗓 {formatDate(raffle.stay_date)}</div>
            </div>

            {/* Tickets seleccionados */}
            {selectedTickets.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                  {t('Your tickets', 'Tus boletos')}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {selectedTickets.map(n => (
                    <span key={n} style={{ width: 28, height: 28, borderRadius: 5, background: 'var(--brand-light)', color: 'var(--brand-dark)', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                <span>{ticketCount} × {raffle.ticket_price} {raffle.currency}</span><span>{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                <span>{t('Platform fee (10%)', 'Comisión (10%)')}</span><span>{fee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <span>Total</span><span>{total} {raffle.currency}</span>
              </div>
            </div>

            {/* Garantías */}
            <div style={{ background: 'var(--brand-light)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
              {[
                t('Guaranteed winner every draw', 'Ganador garantizado en cada sorteo'),
                t('Full refund if minimum not reached', 'Reembolso si no se alcanza el mínimo'),
                t('Damage insurance included', 'Seguro de daños incluido'),
                t('Transparent live draw', 'Sorteo en vivo y transparente'),
              ].map(g => (
                <div key={g} style={{ fontSize: 11, color: 'var(--brand-dark)', display: 'flex', gap: 6, marginBottom: 4 }}>
                  <span>✓</span><span>{g}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handlePay}
              disabled={paying}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '13px', opacity: paying ? 0.7 : 1 }}
            >
              {paying ? '⏳ ' + t('Processing...', 'Procesando...') : `🔒 ${t(`Pay ${total} ${raffle.currency}`, `Pagar ${total} ${raffle.currency}`)}`}
            </button>

            <Link href={`/raffle/${raffleSlug}`} style={{ display: 'block', textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 10, textDecoration: 'none' }}>
              ← {t('Back to raffle', 'Regresar a la rifa')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
