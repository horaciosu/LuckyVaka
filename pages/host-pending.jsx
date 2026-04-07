import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function HostPending({ lang, setLang }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar lang={lang} setLang={setLang} />
      <div style={{ maxWidth: 520, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>⏳</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
          {lang === 'en' ? 'Application under review' : 'Solicitud en revisión'}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 32 }}>
          {lang === 'en'
            ? 'We received your application and our team is reviewing it. We will notify you by email once approved.'
            : 'Recibimos tu solicitud y nuestro equipo la está revisando. Te notificaremos por correo una vez aprobada.'}
        </p>
        <Link href="/dashboard" style={{
          display: 'inline-block', padding: '10px 24px', borderRadius: 8,
          background: 'var(--primary)', color: 'white', textDecoration: 'none', fontSize: 14
        }}>
          {lang === 'en' ? 'Go to my dashboard' : 'Ir a mi panel'}
        </Link>
      </div>
    </div>
  )
}
