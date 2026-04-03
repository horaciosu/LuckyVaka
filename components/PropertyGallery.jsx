import { useState } from 'react'

export default function PropertyGallery({ images = [], emoji = '🏡', gradient, title = '' }) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  // If no real images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div style={{
        height: 260, borderRadius: 12,
        background: gradient || 'linear-gradient(135deg, #c8e6c9, #a5d6a7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 80, marginBottom: 20,
      }}>
        {emoji}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Main image */}
      <div
        style={{ height: 260, borderRadius: 12, overflow: 'hidden', cursor: 'zoom-in', position: 'relative', marginBottom: 8 }}
        onClick={() => setLightbox(true)}
      >
        <img
          src={images[active]}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 10 }}>
          {active + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {images.map((url, i) => (
            <div
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: 64, height: 52, borderRadius: 7, overflow: 'hidden',
                cursor: 'pointer', flexShrink: 0,
                border: active === i ? '2px solid var(--brand)' : '2px solid transparent',
                opacity: active === i ? 1 : 0.7,
                transition: 'all 0.12s',
              }}
            >
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, cursor: 'zoom-out',
          }}
        >
          <img
            src={images[active]}
            alt={title}
            style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setActive(a => (a - 1 + images.length) % images.length) }}
                style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 24, width: 44, height: 44, borderRadius: '50%', cursor: 'pointer' }}
              >‹</button>
              <button
                onClick={e => { e.stopPropagation(); setActive(a => (a + 1) % images.length) }}
                style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 24, width: 44, height: 44, borderRadius: '50%', cursor: 'pointer' }}
              >›</button>
            </>
          )}
          <button
            onClick={() => setLightbox(false)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 20, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer' }}
          >×</button>
        </div>
      )}
    </div>
  )
}
