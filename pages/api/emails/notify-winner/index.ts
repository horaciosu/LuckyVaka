import type { NextApiRequest, NextApiResponse } from 'next'
import { resend, FROM_EMAIL } from '@/lib/emails/resend'
import { NotifyWinnerEmail } from '@/lib/emails/templates/notify-winner'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  try {
    const { winnerEmail, winnerName, propertyName, propertyLocation, winningTicketNumber, stayDate, stayNights, hostName, hostContactUrl, cashAlternative, currency, raffleId } = req.body
    if (!winnerEmail || !winnerName || !propertyName || winningTicketNumber === undefined) return res.status(400).json({ error: 'Faltan campos obligatorios' })
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [winnerEmail],
      subject: `🏆 ¡Ganaste! Tu estancia en ${propertyName} te espera`,
      react: NotifyWinnerEmail({ winnerName, propertyName, propertyLocation, winningTicketNumber, stayDate, stayNights: stayNights ?? 1, hostName, hostContactUrl, cashAlternative, currency: currency ?? 'MXN', raffleId }),
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true, emailId: data?.id })
  } catch (err) {
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
