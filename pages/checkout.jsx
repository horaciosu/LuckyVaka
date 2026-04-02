import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { RAFFLES } from '../lib/data'

export default function Checkout({ lang, setLang }) {
  const router = useRouter()
  const { raffle: raffleSlug, qty, tickets } = router.query

  const raffle = RAFFLES.find(r => r.slug === raffleSlug) || RAFFLES[0]
  const ticketCount = parseInt(qty) || 1
  const selectedTickets = tickets ? tickets.split(',').filter(Boolean) : []

  const subtotal = ticketCount * raffle.ticket_price
  const fee = +(subtotal * 0.1).toFixed(2)
  const total = +(subtotal + fee).toFixed(2)

  const [step, setStep] = useState('form') // 'form' | 'success'
  const [tab, setTab] = useState('card')
  const [form, setForm] = useState({ fname: '', lname: '', email: '', card: '', expiry: '', cvv: '', name: '' })
  const [errors, setErrors] = useState({})
  const [terms, setTerms] = useState(false)

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

  const handlePay = () => {
    if (!validate()) return
    // In production: call Stripe API here
    setStep('success')
  }

  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar lang={lang} setLang={setLang} />
        <div style={{ maxWidth: 520, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            {lang === 'es' ? "¡Estás en el sorteo!" : "You're in the draw!"}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.65 }}>
            {lang === 'es'
              ? `Tus boletos están confirmados. Te enviaremos el resultado del sorteo el ${raffle.draw_date} por email.`
              : `Your tickets are confirmed. We'll email you the draw result on ${raffle.draw_date}.`
            }
          </p>

          {/* Confirmed tickets */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            {(selectedTickets.length > 0 ? selectedTickets : ['47', '112']).map(n => (
              <div key={n} style={{
                width: 42, height: 42, borderRadius: 8,
                background: 'var(--brand)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600,
              }}>{n}</div>
            ))}
          </div>

          <div className="card" style={{ textAlign: 'left', marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 2 }}>
              <div>📍 <strong>{raffle.title}</strong></div>
              <div>🗓 {lang === 'es' ? 'Fecha de estancia:' : 'Stay date:'} {raffle.stay_date}</div>
              <div>🎯 {lang === 'es' ? 'Sorteo:' : 'Draw:'} {raffle.draw_date} — Live on Lucky Vaka</div>
              <div>📧 {lang === 'es' ? 'Confirmación enviada a:' : 'Confirmation sent to:'} {form.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/dashboard" className="btn-primary">{lang === 'es' ? 'Ver mis boletos' : 'View my tickets'}</Link>
            <Link href="/" className="btn-secondary">{lang === 'es' ? 'Ver más rifas' : 'Browse more'}</Link>
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
        {[
          lang === 'es' ? 'Explorar' : 'Browse',
          lang === 'es' ? 'Seleccionar' : 'Select',
          lang === 'es' ? 'Pago' : 'Payment',
          lang === 'es' ? 'Confirmación' : 'Confirm',
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 600,
                background: i < 2 ? 'var(--brand)' : i === 2 ? 'var(--brand)' : '#EEECE8',
                color: i <= 2 ? '#fff' : 'var(--muted)',
              }}>
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
              {lang === 'es' ? 'Información de contacto' : 'Contact information'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{lang === 'es' ? 'Nombre' : 'First name'} *</label>
                <input value={form.fname} onChange={e => update('fname', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid ${errors.fname ? '#E24B4A' : 'var(--border)'}`, borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                  placeholder="Carlos" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{lang === 'es' ? 'Apellido' : 'Last name'}</label>
                <input value={form.lname} onChange={e => update('lname', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                  placeholder="Martínez" />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Email *</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: `1px solid ${errors.email ? '#E24B4A' : 'var(--border)'}`, borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                placeholder="tu@email.com" />
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>
                {lang === 'es' ? 'Tu confirmación y resultado del sorteo llegarán aquí.' : 'Confirmation and draw result sent here.'}
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              {lang === 'es' ? 'Método de pago' : 'Payment method'}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['card', '💳 Card'], ['paypal', 'PayPal'], ['spei', '🏦 SPEI']].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)} style={{
                  flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  border: `1px solid ${tab === id ? 'var(--brand)' : 'var(--border)'}`,
                  background: tab === id ? 'var(--brand-light)' : 'transparent',
                  color: tab === id ? 'var(--brand-dark)' : 'var(--muted)',
                  fontWeight: tab === id ? 500 : 400,
                }}>{label}</button>
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
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{lang === 'es' ? 'Número de tarjeta' : 'Card number'} *</label>
                  <input value={form.card} onChange={e => update('card', formatCard(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                    placeholder="1234 5678 9012 3456" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{lang === 'es' ? 'Vencimiento' : 'Expiry'} *</label>
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
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>You'll be redirected to PayPal to complete payment.</div>
              </div>
            )}

            {tab === 'spei' && (
              <div style={{ background: '#F4F3EF', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>Transfer to / Transferir a:</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 2 }}>
                  <div><strong>Bank:</strong> BBVA México</div>
                  <div><strong>CLABE:</strong> 012 180 0012345678 90</div>
                  <div><strong>Amount:</strong> ${total} USD equiv.</div>
                  <div><strong>Reference:</strong> LV-{raffle.id.toUpperCase().slice(0, 8)}</div>
                </div>
                <div style={{ fontSize: 10, color: '#633806', background: '#FAEEDA', borderRadius: 4, padding: '6px 8px', marginTop: 8 }}>
                  ⚠️ {lang === 'es' ? 'Tus boletos están reservados por 2 horas.' : 'Tickets reserved for 2 hours. Complete transfer before expiry.'}
                </div>
              </div>
            )}
          </div>

          {/* Terms */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
            <label>
              {lang === 'es'
                ? 'Acepto los Términos y Condiciones y el Reglamento de Rifas. Entiendo que esta es una compra basada en azar.'
                : 'I agree to the Terms & Conditions and Raffle Rules. I understand this is a chance-based purchase.'
              }
              {errors.terms && <span style={{ color: '#E24B4A', marginLeft: 4 }}>*</span>}
            </label>
          </div>
        </div>

        {/* RIGHT — summary */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              {lang === 'es' ? 'Resumen del pedido' : 'Order summary'}
            </div>

            {/* Property */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 52, height: 42, borderRadius: 6, background: raffle.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {raffle.emoji}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{raffle.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>📍 {raffle.location}</div>
                <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: 2 }}>🗓 Stay: {raffle.stay_date}</div>
              </div>
            </div>

            {/* Tickets */}
            {selectedTickets.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Your tickets</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {selectedTickets.slice(0, 10).map(n => (
                    <span key={n} style={{ width: 28, height: 28, borderRadius: 5, background: 'var(--brand-light)', color: 'var(--brand-dark)', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                <span>{ticketCount} × ${raffle.ticket_price}</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                <span>Platform fee (10%)</span><span>${fee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <span>Total</span><span>${total} USD</span>
              </div>
            </div>

            {/* Guarantees */}
            <div style={{ background: 'var(--brand-light)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
              {['Guaranteed winner every draw', 'Full refund if minimum not reached', 'Damage insurance included', 'Transparent live draw'].map(g => (
                <div key={g} style={{ fontSize: 11, color: 'var(--brand-dark)', display: 'flex', gap: 6, marginBottom: 4 }}>
                  <span>✓</span><span>{g}</span>
                </div>
              ))}
            </div>

            <button onClick={handlePay} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '13px' }}>
              🔒 {lang === 'es' ? `Pagar $${total} USD` : `Pay $${total} USD`}
            </button>

            <Link href={`/raffle/${raffle.slug}`} style={{ display: 'block', textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 10, textDecoration: 'none' }}>
              ← {lang === 'es' ? 'Regresar a la rifa' : 'Back to raffle'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
