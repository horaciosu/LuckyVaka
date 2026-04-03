import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

export default function Login({ lang, setLang }) {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const t = (en, es) => lang === 'es' ? es : en
  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: false })) }

  const inputStyle = (field) => ({
    width: '100%', padding: '10px 12px',
    border: `1px solid ${errors[field] ? '#E24B4A' : 'var(--border)'}`,
    borderRadius: 8, fontSize: 14,
    background: 'var(--surface)', color: 'var(--text)', outline: 'none',
  })

  const handleLogin = async () => {
    const e = {}
    if (!form.email.includes('@')) e.email = true
    if (!form.password) e.password = true
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setErrors({ submit: t('Incorrect email or password', 'Email o contraseña incorrectos') })
      setLoading(false)
      return
    }

    // Redirect based on role
    const role = data.user?.user_metadata?.role
    if (role === 'host') {
      router.push('/host')
    } else {
      router.push('/dashboard')
    }
  }

  const handleReset = async () => {
    if (!resetEmail.includes('@')) return
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (!error) setResetSent(true)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ maxWidth: 400, margin: '60px auto', padding: '0 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🌊</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            {t('Welcome back', 'Bienvenido de vuelta')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            {t("Don't have an account?", '¿No tienes cuenta?')}{' '}
            <Link href="/signup" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 500 }}>
              {t('Sign up', 'Regístrate')}
            </Link>
          </p>
        </div>

        {!showReset ? (
          <div className="card">
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Email *</label>
              <input
                type="email" value={form.email}
                onChange={e => update('email', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="tu@email.com"
                style={inputStyle('email')}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)' }}>{t('Password', 'Contraseña')} *</label>
                <button
                  onClick={() => setShowReset(true)}
                  style={{ fontSize: 11, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {t('Forgot password?', '¿Olvidaste tu contraseña?')}
                </button>
              </div>
              <input
                type="password" value={form.password}
                onChange={e => update('password', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                style={inputStyle('password')}
              />
            </div>

            {errors.submit && (
              <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#A32D2D', marginBottom: 14 }}>
                ⚠️ {errors.submit}
              </div>
            )}

            <button
              onClick={handleLogin}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 13, fontSize: 14, marginTop: 8 }}
              disabled={loading}
            >
              {loading ? '⏳ ' + t('Logging in...', 'Entrando...') : t('Log in', 'Iniciar sesión')}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <Link href="/signup" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 13 }}>
              {t('Create new account', 'Crear cuenta nueva')}
            </Link>
          </div>
        ) : (
          <div className="card">
            <button onClick={() => setShowReset(false)} style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
              ← {t('Back to login', 'Regresar')}
            </button>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              {t('Reset password', 'Restablecer contraseña')}
            </div>
            {!resetSent ? (
              <>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
                  {t("Enter your email and we'll send you a reset link.", 'Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.')}
                </p>
                <input
                  type="email" value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--surface)', color: 'var(--text)', outline: 'none', marginBottom: 12 }}
                />
                <button onClick={handleReset} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
                  {t('Send reset link', 'Enviar enlace')}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📧</div>
                <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>{t('Email sent!', '¡Email enviado!')}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t('Check your inbox for the reset link.', 'Revisa tu bandeja de entrada.')}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
