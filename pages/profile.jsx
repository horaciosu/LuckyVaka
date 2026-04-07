import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { useAuth } from '../lib/useAuth'
import { useProfile } from '../lib/useProfile'
import { supabase } from '../lib/supabase'
import Cropper from 'react-easy-crop'

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
  })
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut, isHost } = useAuth({ required: false })
  const { profile, loading: profileLoading, updateProfile, uploadAvatar } = useProfile(user?.id)
  const [lang, setLang] = useState('es')
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [rawImageSrc, setRawImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const t = (en, es) => lang === 'es' ? es : en

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || user?.user_metadata?.full_name || '',
        phone: profile.phone || '',
      })
      setAvatarPreview(profile.avatar_url || null)
    } else if (user) {
      setForm(f => ({ ...f, full_name: user.user_metadata?.full_name || '' }))
    }
  }, [profile, user])

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError(t('Max 5MB', 'Máximo 5MB')); return }
    setRawImageSrc(URL.createObjectURL(file))
    setShowCropModal(true)
    setError(null)
    e.target.value = ''
  }

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCropConfirm = async () => {
    try {
      setUploadingPhoto(true)
      setShowCropModal(false)
      const blob = await getCroppedImg(rawImageSrc, croppedAreaPixels)
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      const { url, error: uploadError } = await uploadAvatar(file)
      if (uploadError) setError(t('Error uploading photo', 'Error al subir la foto'))
      else setAvatarPreview(url)
    } catch {
      setError(t('Error processing image', 'Error al procesar la imagen'))
    } finally {
      setUploadingPhoto(false)
      URL.revokeObjectURL(rawImageSrc)
      setRawImageSrc(null)
    }
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    URL.revokeObjectURL(rawImageSrc)
    setRawImageSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError(t('Name is required', 'El nombre es requerido')); return }
    setSaving(true)
    setError(null)
    const { error: updateError } = await updateProfile({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
    })
    await supabase.auth.updateUser({ data: { full_name: form.full_name.trim() } })
    if (updateError) setError(t('Error saving changes', 'Error al guardar los cambios'))
    else { setSuccess(true); setTimeout(() => setSuccess(false), 3000) }
    setSaving(false)
  }

  const initials = (form.full_name || user?.user_metadata?.full_name || '?')
    .split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

  if (authLoading || profileLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ textAlign: 'center', padding: '80px 0', fontSize: 13, color: 'var(--muted)' }}>
        ⏳ {t('Loading...', 'Cargando...')}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />

      {/* Modal Crop */}
      {showCropModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            {t('Adjust your photo', 'Ajusta tu foto')}
          </p>
          <div style={{ position: 'relative', width: 300, height: 300 }}>
            <Cropper
              image={rawImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div style={{ marginTop: 20, width: 300 }}>
            <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center', marginBottom: 6 }}>
              {t('Zoom', 'Zoom')}
            </p>
            <input
              type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#22c55e' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={handleCropCancel} style={{
              padding: '10px 28px', borderRadius: 8, border: '1px solid #555',
              background: 'transparent', color: '#fff', fontSize: 14, cursor: 'pointer'
            }}>
              {t('Cancel', 'Cancelar')}
            </button>
            <button onClick={handleCropConfirm} style={{
              padding: '10px 28px', borderRadius: 8, border: 'none',
              background: '#22c55e', color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600
            }}>
              {t('Use photo', 'Usar foto')}
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 16px 48px' }}>

        <div style={{ marginBottom: 28 }}>
          <Link href={isHost ? '/host' : '/dashboard'} style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>
            ← {t('Back', 'Regresar')}
          </Link>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
          {t('Edit profile', 'Editar perfil')}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>
          {t('Update your photo and personal information.', 'Actualiza tu foto e información personal.')}
        </p>

        {/* Foto */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
            {t('Profile photo', 'Foto de perfil')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: 'var(--brand-light)', flexShrink: 0 }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--brand-dark)' }}>{initials}</div>
              }
              {uploadingPhoto && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⏳</div>
              )}
            </div>
            <div>
              <input id="avatarFileInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />
              <label htmlFor="avatarFileInput" style={{
                display: 'inline-block', padding: '8px 16px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text)', fontSize: 13, marginBottom: 8,
                cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                opacity: uploadingPhoto ? 0.6 : 1, userSelect: 'none'
              }}>
                📷 {uploadingPhoto ? t('Uploading...', 'Subiendo...') : t('Change photo', 'Cambiar foto')}
              </label>
              {avatarPreview && (
                <div>
                  <button onClick={async () => { await updateProfile({ avatar_url: null }); setAvatarPreview(null) }}
                    style={{ fontSize: 12, color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {t('Remove photo', 'Quitar foto')}
                  </button>
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                {t('JPG or PNG. Max 5MB.', 'JPG o PNG. Máx 5MB.')}
              </div>
            </div>
          </div>
        </div>

        {/* Info personal */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
            {t('Personal information', 'Información personal')}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
              {t('Full name', 'Nombre completo')} *
            </label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder={t('Your full name', 'Tu nombre completo')}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>Email</label>
            <input value={user?.email || ''} disabled
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--surface)', color: 'var(--muted)', outline: 'none' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
              {t('Email cannot be changed.', 'El email no se puede cambiar.')}
            </span>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
              {t('Phone', 'Teléfono')}
            </label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+52 664 000 0000"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
          </div>
        </div>

        {/* Cuenta */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
            {t('Account', 'Cuenta')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            <span>{t('Role', 'Rol')}</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>
              {isHost ? (lang === 'es' ? 'Anfitrión' : 'Host') : (lang === 'es' ? 'Viajero' : 'Traveler')}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)' }}>
            <span>{t('Member since', 'Miembro desde')}</span>
            <span style={{ color: 'var(--text)' }}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { month: 'long', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginBottom: 14 }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'var(--brand-light)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--brand-dark)', marginBottom: 14 }}>
            ✅ {t('Changes saved successfully.', 'Cambios guardados correctamente.')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} disabled={saving} className="btn-primary"
            style={{ flex: 1, justifyContent: 'center', padding: 13, fontSize: 14 }}>
            {saving ? '💾 ' + t('Saving...', 'Guardando...') : '💾 ' + t('Save changes', 'Guardar cambios')}
          </button>
          <button onClick={signOut}
            style={{ padding: '13px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
            🚪 {t('Sign out', 'Cerrar sesión')}
          </button>
        </div>

      </div>
    </div>
  )
}
