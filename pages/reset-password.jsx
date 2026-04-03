import { useState } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

export default function ResetPassword({ lang, setLang }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const t = (en, es) => lang === 'es' ? es : en

  const handleReset = async () => {
    if (password.length < 6) { setError(t('Password must be at least 6 characters', 'Mínimo 6 caracteres')); return }
    if (password !== confirm) { setError(t('Passwords do not match', 'Las contraseñas no coinciden')); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ maxWidth: 400, margin: '60px auto', padding: '0 24px' }}>
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
            🔐 {t('Set new password', 'Nueva contraseña')}
          </div>
          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{t('Password updated! Redirecting...', '¡Contraseña actualizada! Redirigiendo...')}</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>{t('New password', 'Nueva contraseña')}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>{t('Confirm password', 'Confirmar contraseña')}</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
              </div>
              {error && <div style={{ fontSize: 12, color: '#E24B4A', marginBottom: 12 }}>⚠️ {error}</div>}
              <button onClick={handleReset} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} disabled={loading}>
                {loading ? '⏳...' : t('Update password', 'Actualizar contraseña')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
