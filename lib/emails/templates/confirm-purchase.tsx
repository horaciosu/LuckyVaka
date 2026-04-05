// lib/emails/templates/confirm-purchase.tsx
import * as React from 'react'

interface ConfirmPurchaseEmailProps {
  clientName: string
  propertyName: string
  propertyLocation: string
  ticketNumbers: number[]
  totalPaid: number
  currency: string
  raffleDate: string
  stayDate: string
  raffleId: string
  ticketImageUrl?: string
}

export function ConfirmPurchaseEmail({
  clientName,
  propertyName,
  propertyLocation,
  ticketNumbers,
  totalPaid,
  currency,
  raffleDate,
  stayDate,
  raffleId,
  ticketImageUrl,
}: ConfirmPurchaseEmailProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Confirmación de compra - Lucky Vacations</title>
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
            <div style={styles.heroIcon}>🎟️</div>
            <h2 style={styles.heroTitle}>¡Compra confirmada!</h2>
            <p style={styles.heroSubtitle}>
              Ya estás participando en la rifa. ¡Buena suerte, {clientName}!
            </p>
          </div>

          {/* Property Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Detalles de tu participación</h3>

            <div style={styles.propertyInfo}>
              <p style={styles.propertyName}>{propertyName}</p>
              <p style={styles.propertyLocation}>📍 {propertyLocation}</p>
            </div>

            <div style={styles.divider} />

            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Fecha del sorteo</span>
                <span style={styles.infoValue}>{raffleDate}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Fecha de estancia</span>
                <span style={styles.infoValue}>{stayDate}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Total pagado</span>
                <span style={styles.infoValue}>{currency} {totalPaid.toFixed(2)}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>No. de folio</span>
                <span style={styles.infoValue}>#{raffleId}</span>
              </div>
            </div>
          </div>

          {/* Ticket Numbers */}
          <div style={styles.ticketsSection}>
            <h3 style={styles.ticketsSectionTitle}>
              {ticketNumbers.length === 1 ? 'Tu boleto' : `Tus ${ticketNumbers.length} boletos`}
            </h3>
            <div style={styles.ticketsGrid}>
              {ticketNumbers.map((num) => (
                <div key={num} style={styles.ticketBadge}>
                  <span style={styles.ticketNumber}>{String(num).padStart(4, '0')}</span>
                </div>
              ))}
            </div>
            <p style={styles.ticketsNote}>
              Guarda estos números — son tu participación oficial en el sorteo.
            </p>
          </div>

          {/* CTA */}
          <div style={styles.ctaSection}>
            <a
              href={`https://luckyvaka.com/mis-rifas`}
              style={styles.ctaButton}
            >
              Ver mis rifas activas →
            </a>
          </div>

          {/* How it works */}
          <div style={styles.howItWorks}>
            <h3 style={styles.howTitle}>¿Cómo funciona el sorteo?</h3>
            <div style={styles.steps}>
              <div style={styles.step}>
                <span style={styles.stepIcon}>🎰</span>
                <span style={styles.stepText}>El sorteo se vincula con la Lotería Nacional</span>
              </div>
              <div style={styles.step}>
                <span style={styles.stepIcon}>📱</span>
                <span style={styles.stepText}>Te notificamos al instante si eres ganador</span>
              </div>
              <div style={styles.step}>
                <span style={styles.stepIcon}>🏡</span>
                <span style={styles.stepText}>Coordinas directamente con el anfitrión</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              ¿Tienes preguntas? Escríbenos a{' '}
              <a href="mailto:soporte@luckyvaka.com" style={styles.footerLink}>
                soporte@luckyvaka.com
              </a>
            </p>
            <p style={styles.footerLegal}>
              Lucky Vacations · luckyvaka.com
            </p>
            <p style={styles.footerLegal}>
              Este correo es una confirmación automática. Si no realizaste esta compra,{' '}
              <a href="mailto:soporte@luckyvaka.com" style={styles.footerLink}>
                contáctanos de inmediato.
              </a>
            </p>
          </div>

        </div>
      </body>
    </html>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
    padding: '28px 32px',
    textAlign: 'center',
  },
  logo: {
    color: '#c9a96e',
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    letterSpacing: '-0.5px',
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
    fontSize: '48px',
    marginBottom: '12px',
  },
  heroTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 8px',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: '#555',
    margin: 0,
  },
  card: {
    padding: '28px 32px',
    borderBottom: '1px solid #f0ebe3',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    margin: '0 0 16px',
  },
  propertyName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 4px',
  },
  propertyLocation: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  propertyInfo: {
    marginBottom: '20px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#f0ebe3',
    margin: '0 0 20px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  infoLabel: {
    fontSize: '11px',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: '15px',
    color: '#1a1a1a',
    fontWeight: '600',
  },
  ticketsSection: {
    padding: '28px 32px',
    backgroundColor: '#faf7f3',
    borderBottom: '1px solid #ede8e0',
    textAlign: 'center',
  },
  ticketsSectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#555',
    margin: '0 0 16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  ticketsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  ticketBadge: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    padding: '10px 16px',
    minWidth: '64px',
  },
  ticketNumber: {
    color: '#c9a96e',
    fontSize: '20px',
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: '2px',
  },
  ticketsNote: {
    fontSize: '12px',
    color: '#999',
    margin: '8px 0 0',
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
    fontWeight: '600',
    padding: '14px 32px',
    borderRadius: '8px',
    textDecoration: 'none',
    letterSpacing: '-0.2px',
  },
  howItWorks: {
    padding: '28px 32px',
    borderBottom: '1px solid #f0ebe3',
  },
  howTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#555',
    margin: '0 0 16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stepIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  stepText: {
    fontSize: '14px',
    color: '#444',
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
  footerLink: {
    color: '#c9a96e',
    textDecoration: 'none',
  },
  footerLegal: {
    fontSize: '11px',
    color: '#aaa',
    margin: '4px 0 0',
  },
}
