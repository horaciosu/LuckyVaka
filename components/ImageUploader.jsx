import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function ImageUploader({ propertyId, onUploadComplete, lang = 'en' }) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const uploadFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed / Solo se permiten imágenes')
      return null
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max 5MB / Archivo muy grande. Máximo 5MB')
      return null
    }

    const ext = file.name.split('.').pop()
    const fileName = `${propertyId || 'temp'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setError(uploadError.message)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleFiles = async (files) => {
    setError(null)
    setUploading(true)
    const newImages = []

    for (const file of Array.from(files).slice(0, 10)) {
      const url = await uploadFile(file)
      if (url) newImages.push(url)
    }

    const updated = [...images, ...newImages]
    setImages(updated)
    if (onUploadComplete) onUploadComplete(updated)
    setUploading(false)
  }

  const removeImage = (idx) => {
    const updated = images.filter((_, i) => i !== idx)
    setImages(updated)
    if (onUploadComplete) onUploadComplete(updated)
  }

  return (
    <div>
      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        style={{
          border: `2px dashed ${dragOver ? 'var(--brand)' : 'var(--border)'}`,
          borderRadius: 10,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'var(--brand-light)' : 'var(--bg)',
          transition: 'all 0.15s',
          marginBottom: 12,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 500 }}>
              {lang === 'es' ? 'Subiendo fotos...' : 'Uploading photos...'}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              {lang === 'es' ? 'Arrastra tus fotos aquí' : 'Drag your photos here'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {lang === 'es'
                ? 'o haz click para seleccionar · Máx 5MB por foto · JPG, PNG'
                : 'or click to select · Max 5MB per photo · JPG, PNG'
              }
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontSize: 12, color: '#E24B4A', marginBottom: 10, padding: '6px 10px', background: '#FCEBEB', borderRadius: 6 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {images.map((url, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1' }}>
              <img
                src={url}
                alt={`Property photo ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                onClick={() => removeImage(i)}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', color: '#fff',
                  border: 'none', cursor: 'pointer', fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
              {i === 0 && (
                <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 9, background: 'var(--brand)', color: '#fff', padding: '2px 5px', borderRadius: 3 }}>
                  MAIN
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
          {images.length} {lang === 'es' ? 'foto(s) subida(s)' : 'photo(s) uploaded'} · {lang === 'es' ? 'La primera es la foto principal' : 'First photo is the main image'}
        </div>
      )}
    </div>
  )
}
