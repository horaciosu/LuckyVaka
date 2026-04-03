import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

export default function SignUp({ lang, setLang }) {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1=role, 2=form
  const [role, setRole] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const [showPass, setShowPass] = useState(false)

  const t = (en, es) => lang === 'es' ? es : en
  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: false })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = true
    if (!form.email.includes('@')) e.email = true
    if (form.password.length < 6) e.password = true
    if (form.password !== form.confirm) e.confirm = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSignUp = async () => {
    if (!validate()) return
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, role },
      },
    })

    if (error) {
      setErrors({ submit: error.message })
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  const inputStyle = (field) => ({
    width: '100%', padding: '10px 12px',
    border: `1px solid ${errors[field] ? '#E24B4A' : 'var(--border)'}`,
    borderRadius: 8, fontSize: 14,
    background: 'var(--surface)', color: 'var(--text)', outline: 'none',
  })

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar lang={lang} setLang={setLang} />
        <div style={{ maxWidth: 420, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
            {t('Check your email', 'Revisa tu email')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
            {t('We sent a confirmation link to', 'Enviamos un enlace de confirmación a')} <strong>{form.email}</strong>.
            {t(' Click it to activate your account.', ' Haz click para activar tu cuenta.')}
          </p>
          <Link href="/login" className="btn-primary">{t('Go to login', 'Ir a iniciar sesión')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            {t('Create your account', 'Crea tu cuenta')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            {t('Already have an account?', '¿Ya tienes cuenta?')}{' '}
            <Link href="/login" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 500 }}>
              {t('Log in', 'Inicia sesión')}
            </Link>
          </p>
        </div>

        {/* Step 1 — Role selection */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', textAlign: 'center', marginBottom: 20 }}>
              {t('I want to...', 'Quiero...')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {[
                {
                  id: 'guest',
                  icon: '🎟',
                  title: t('Win vacations', 'Ganar vacaciones'),
                  desc: t('Buy tickets and try my luck on premium stays', 'Comprar boletos y probar mi suerte en estancias premium'),
                },
                {
                  id: 'host',
                  icon: '🏡',
                  title: t('List my property', 'Registrar mi propiedad'),
                  desc: t('Raffle my property and earn guaranteed income', 'Rifar mi propiedad y ganar ingresos garantizados'),
                },
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setRole(opt.id)}
                  style={{
                    padding: '20px 16px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${role === opt.id ? 'var(--brand)' : 'var(--border)'}`,
                    background: role === opt.id ? 'var(--brand-light)' : 'var(--surface)',
                    textAlign: 'center', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{opt.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{opt.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => role && setStep(2)}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 13, fontSize: 14, opacity: role ? 1 : 0.5 }}
            >
              {t('Continue', 'Continuar')} →
            </button>
          </div>
        )}

        {/* Step 2 — Form */}
        {step === 2 && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 20 }}>{role === 'guest' ? '🎟' : '🏡'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                  {role === 'guest' ? t('Traveler account', 'Cuenta de viajero') : t('Host account', 'Cuenta de anfitrión')}
                </div>
                <button onClick={() => setStep(1)} style={{ fontSize: 11, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {t('Change', 'Cambiar')}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>{t('Full name', 'Nombre completo')} *</label>
              <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Horacio Soria" style={inputStyle('name')} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Email *</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="tu@email.com" style={inputStyle('email')} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>{t('Password', 'Contraseña')} * <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>(min. 6 {t('characters', 'caracteres')})</span></label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="••••••••" style={{ ...inputStyle('password'), paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted)' }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>{t('Confirm password', 'Confirmar contraseña')} *</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={form.confirm} onChange={e => update('confirm', e.target.value)} placeholder="••••••••" style={{ ...inputStyle('confirm'), paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted)' }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {errors.confirm && <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 4 }}>{t('Passwords do not match', 'Las contraseñas no coinciden')}</div>}
            </div>

            {errors.submit && (
              <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#A32D2D', marginBottom: 14 }}>
                ⚠️ {errors.submit}
              </div>
            )}

            <button onClick={handleSignUp} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13, fontSize: 14 }} disabled={loading}>
              {loading ? '⏳ ' + t('Creating account...', 'Creando cuenta...') : '🚀 ' + t('Create account', 'Crear cuenta')}
            </button>

            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
              {t('By creating an account you agree to our', 'Al crear una cuenta aceptas nuestros')}{' '}
              <span style={{ color: 'var(--brand)', cursor: 'pointer' }}>{t('Terms & Conditions', 'Términos y condiciones')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
