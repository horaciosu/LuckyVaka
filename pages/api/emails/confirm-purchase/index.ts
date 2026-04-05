import type { NextApiRequest, NextApiResponse } from 'next'
import { getResend, FROM_EMAIL } from '@/lib/emails/resend'
import { ConfirmPurchaseEmail } from '@/lib/emails/templates/confirm-purchase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  try {
    const { clientEmail, clientName, propertyName, propertyLocation, ticketNumbers, totalPaid, currency, raffleDate, stayDate, raffleId } = req.body
    if (!clientEmail || !clientName || !propertyName || !ticketNumbers?.length) return res.status(400).json({ error: 'Faltan campos obligatorios' })
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [clientEmail],
      subject: `🎟️ Confirmación de compra — ${propertyName}`,
      react: ConfirmPurchaseEmail({ clientName, propertyName, propertyLocation, ticketNumbers, totalPaid, currency: currency ?? 'MXN', raffleDate, stayDate, raffleId }),
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true, emailId: data?.id })
  } catch (err) {
    console.error('[confirm-purchase]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
