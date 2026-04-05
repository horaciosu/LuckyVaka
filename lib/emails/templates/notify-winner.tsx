// lib/emails/templates/notify-winner.tsx
import * as React from 'react'

interface NotifyWinnerEmailProps {
  winnerName: string
  propertyName: string
  propertyLocation: string
  winningTicketNumber: number
  stayDate: string
  stayNights: number
  hostName: string
  hostContactUrl: string
  cashAlternative?: number
  currency?: string
  raffleId: string
}

export function NotifyWinnerEmail({
  winnerName,
  propertyName,
  propertyLocation,
  winningTicketNumber,
  stayDate,
  stayNights,
  hostName,
  hostContactUrl,
  cashAlternative,
  currency = 'MXN',
  raffleId,
}: NotifyWinnerEmailProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>¡Ganaste! - Lucky Vacations</title>
      </head>
      <body style={styles.body}>
        <div style={styles.container}>

          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.logo}>Lucky Vacations</h1>
          </div>

          {/* Winner Hero */}
          <div style={styles.hero}>
            <div style={styles.confetti}>🎉🏆🎉</div>
            <h2 style={styles.heroTitle}>¡Felicidades, {winnerName}!</h2>
            <p style={styles.heroSubtitle}>
              Tu boleto fue el ganador del sorteo. Las vacaciones son tuyas.
            </p>
            <div style={styles.winningTicket}>
              <span style={styles.winningLabel}>Boleto ganador</span>
              <span style={styles.winningNumber}>
                {String(winningTicketNumber).padStart(4, '0')}
              </span>
            </div>
          </div>

          {/* Prize Details */}
          <div style={styles.prizeCard}>
            <h3 style={styles.sectionTitle}>Tu premio</h3>
            <p style={styles.propertyName}>{propertyName}</p>
            <p style={styles.propertyLocation}>📍 {propertyLocation}</p>

            <div style={styles.divider} />

            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Fecha de estancia</span>
              <span style={styles.infoValue}>{stayDate}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Duración</span>
              <span style={styles.infoValue}>{stayNights} {stayNights === 1 ? 'noche' : 'noches'}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Folio de rifa</span>
              <span style={styles.infoValue}>#{raffleId}</span>
            </div>
          </div>

          {/* Cash Alternative (if offered) */}
          {cashAlternative && (
            <div style={styles.alternativeCard}>
              <p style={styles.alternativeTitle}>💰 También puedes elegir la opción en efectivo</p>
              <p style={styles.alternativeAmount}>
                {currency} {cashAlternative.toLocaleString()}
              </p>
              <p style={styles.alternativeNote}>
                Indícale tu preferencia al anfitrión al hacer contacto.
              </p>
            </div>
          )}

          {/* Next Steps */}
          <div style={styles.nextSteps}>
            <h3 style={styles.sectionTitle}>Próximos pasos</h3>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <div>
                <p style={styles.stepTitle}>Confirma con el anfitrión</p>
                <p style={styles.stepDesc}>
                  {hostName} está esperando tu contacto para coordinar los detalles de tu estancia.
                </p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <div>
                <p style={styles.stepTitle}>Revisa las reglas de la propiedad</p>
                <p style={styles.stepDesc}>
                  Encontrarás las reglas de la casa en tu perfil de Lucky Vacations.
                </p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <div>
                <p style={styles.stepTitle}>¡Disfruta tu estancia!</p>
                <p style={styles.stepDesc}>
                  Lucky Vacations cubre el seguro por daños durante tu hospedaje.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={styles.ctaSection}>
            <a href={hostContactUrl} style={styles.ctaButton}>
              Contactar al anfitrión →
            </a>
            <p style={styles.ctaNote}>
              También puedes hacerlo desde{' '}
              <a href="https://luckyvaka.com/mis-rifas" style={styles.link}>
                tu panel en luckyvaka.com
              </a>
            </p>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              ¿Necesitas ayuda?{' '}
              <a href="mailto:soporte@luckyvaka.com" style={styles.link}>
                soporte@luckyvaka.com
              </a>
            </p>
            <p style={styles.footerLegal}>Lucky Vacations · luckyvaka.com</p>
          </div>

        </div>
      </body>
    </html>
  )
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
    padding: '20px 32px',
    textAlign: 'center',
  },
  logo: {
    color: '#c9a96e',
    fontSize: '22px',
    fontWeight: '700',
    margin: 0,
  },
  hero: {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2417 100%)',
    padding: '40px 32px',
    textAlign: 'center',
  },
  confetti: {
    fontSize: '40px',
    marginBottom: '16px',
  },
  heroTitle: {
    fontSize: '30px',
    fontWeight: '800',
    color: '#c9a96e',
    margin: '0 0 8px',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: '#d4c5a9',
    margin: '0 0 24px',
  },
  winningTicket: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    border: '2px solid #c9a96e',
    borderRadius: '12px',
    padding: '16px 32px',
    gap: '4px',
  },
  winningLabel: {
    fontSize: '11px',
    color: '#c9a96e',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  winningNumber: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'monospace',
    letterSpacing: '4px',
  },
  prizeCard: {
    padding: '28px 32px',
    borderBottom: '1px solid #f0ebe3',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#999',
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
    margin: '0 0 20px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#f0ebe3',
    margin: '0 0 16px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #faf7f3',
  },
  infoLabel: {
    fontSize: '13px',
    color: '#888',
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  alternativeCard: {
    margin: '0 32px',
    backgroundColor: '#fffbf0',
    border: '1px solid #e8d9b0',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'center',
  },
  alternativeTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#7a6030',
    margin: '0 0 8px',
  },
  alternativeAmount: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#c9a96e',
    margin: '0 0 6px',
  },
  alternativeNote: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
  },
  nextSteps: {
    padding: '28px 32px',
    borderBottom: '1px solid #f0ebe3',
  },
  step: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  stepNumber: {
    width: '28px',
    height: '28px',
    backgroundColor: '#1a1a1a',
    color: '#c9a96e',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0,
    lineHeight: '28px',
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 2px',
  },
  stepDesc: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
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
    padding: '14px 36px',
    borderRadius: '8px',
    textDecoration: 'none',
    marginBottom: '12px',
  },
  ctaNote: {
    fontSize: '13px',
    color: '#888',
    margin: '12px 0 0',
  },
  link: {
    color: '#c9a96e',
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
  footerLegal: {
    fontSize: '11px',
    color: '#aaa',
    margin: 0,
  },
}
