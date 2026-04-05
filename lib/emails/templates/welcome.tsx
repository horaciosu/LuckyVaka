// lib/emails/templates/welcome.tsx
import * as React from 'react'

interface WelcomeEmailProps {
  userName: string
  userType: 'client' | 'host'
  dashboardUrl?: string
}

export function WelcomeEmail({
  userName,
  userType,
  dashboardUrl = 'https://luckyvaka.com/dashboard',
}: WelcomeEmailProps) {
  const isHost = userType === 'host'

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Bienvenido a Lucky Vacations</title>
      </head>
      <body style={styles.body}>
        <div style={styles.container}>

          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.logo}>Lucky Vacations</h1>
            <p style={styles.tagline}>Acceso inteligente a experiencias vacacionales de alto valor</p>
          </div>

          {/* Hero */}
          <div style={styles.hero}>
            <div style={styles.heroIcon}>{isHost ? '🏡' : '🎟️'}</div>
            <h2 style={styles.heroTitle}>
              Bienvenido, {userName}
            </h2>
            <p style={styles.heroSubtitle}>
              {isHost
                ? 'Tu propiedad merece más que temporadas bajas. Empieza a rifar y garantiza tu ingreso objetivo.'
                : 'A partir de hoy, las mejores estancias están a un boleto de distancia.'}
            </p>
          </div>

          {/* Value Props */}
          <div style={styles.valueSection}>
            {isHost ? (
              <>
                <FeatureRow
                  icon="💰"
                  title="Ingreso garantizado"
                  desc="Fija tú el valor objetivo. Un solo evento te da lo que antes tardabas meses en alcanzar."
                />
                <FeatureRow
                  icon="📅"
                  title="Tú decides las fechas"
                  desc="Elige qué fechas rifar. Sin ocupación forzada, sin guerra de precios."
                />
                <FeatureRow
                  icon="🛡️"
                  title="Seguro incluido"
                  desc="Lucky Vacations cubre daños durante la estancia del ganador. Cero riesgo para ti."
                />
                <FeatureRow
                  icon="💸"
                  title="Pago post-estancia"
                  desc="Recibes el pago solo después de que el huésped termina su estadía."
                />
              </>
            ) : (
              <>
                <FeatureRow
                  icon="🏖️"
                  title="Propiedades premium desde $1 USD"
                  desc="Casas, cabañas, yates e islas privadas. Solo necesitas un boleto para tener la oportunidad."
                />
                <FeatureRow
                  icon="🎲"
                  title="Siempre hay un ganador"
                  desc="El sorteo solo incluye números vendidos. Tu boleto siempre tiene posibilidades reales."
                />
                <FeatureRow
                  icon="🔒"
                  title="100% seguro"
                  desc="Si la rifa no se activa, tu dinero regresa automáticamente. Cero riesgo de perderlo."
                />
                <FeatureRow
                  icon="📱"
                  title="Te avisamos al instante"
                  desc="Si ganas, recibes una notificación inmediata. No necesitas estar viendo el sorteo."
                />
              </>
            )}
          </div>

          {/* CTA */}
          <div style={styles.ctaSection}>
            <a href={dashboardUrl} style={styles.ctaButton}>
              {isHost ? 'Publicar mi primera rifa →' : 'Explorar rifas activas →'}
            </a>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              ¿Tienes preguntas?{' '}
              <a href="mailto:soporte@luckyvaka.com" style={styles.link}>
                soporte@luckyvaka.com
              </a>
            </p>
            <p style={styles.footerLegal}>Lucky Vacations · luckyvaka.com</p>
            <p style={styles.footerLegal}>
              Recibiste este correo porque te registraste en luckyvaka.com.
            </p>
          </div>

        </div>
      </body>
    </html>
  )
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: string
  title: string
  desc: string
}) {
  return (
    <div style={featureStyles.row}>
      <span style={featureStyles.icon}>{icon}</span>
      <div>
        <p style={featureStyles.title}>{title}</p>
        <p style={featureStyles.desc}>{desc}</p>
      </div>
    </div>
  )
}

const featureStyles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  icon: {
    fontSize: '24px',
    flexShrink: 0,
    marginTop: '2px',
  },
  title: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 2px',
  },
  desc: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
    lineHeight: '1.5',
  },
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f5f0eb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    margin: 0,
    padding: '32px 16px',
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: '24px 32px',
    textAlign: 'center',
  },
  logo: {
    color: '#c9a96e',
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
  },
  tagline: {
    color: '#888',
    fontSize: '12px',
    margin: '6px 0 0',
  },
  hero: {
    backgroundColor: '#faf7f3',
    padding: '36px 32px',
    textAlign: 'center',
    borderBottom: '1px solid #ede8e0',
  },
  heroIcon: {
    fontSize: '44px',
    marginBottom: '12px',
  },
  heroTitle: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#1a1a1a',
    margin: '0 0 10px',
  },
  heroSubtitle: {
    fontSize: '15px',
    color: '#555',
    margin: 0,
    lineHeight: '1.6',
  },
  valueSection: {
    padding: '28px 32px',
    borderBottom: '1px solid #f0ebe3',
  },
  ctaSection: {
    padding: '28px 32px',
    textAlign: 'center',
    borderBottom: '1px solid #f0ebe3',
  },
  ctaButton: {
    display: 'inline-block',
    backgroundColor: '#c9a96e',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    padding: '14px 32px',
    borderRadius: '8px',
    textDecoration: 'none',
  },
  footer: {
    padding: '24px 32px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 8px',
  },
  link: {
    color: '#c9a96e',
    textDecoration: 'none',
  },
  footerLegal: {
    fontSize: '11px',
    color: '#aaa',
    margin: '4px 0 0',
  },
}
