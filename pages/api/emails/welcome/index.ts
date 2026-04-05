import type { NextApiRequest, NextApiResponse } from 'next'
import { getResend, FROM_EMAIL } from '@/lib/emails/resend'
import { WelcomeEmail } from '@/lib/emails/templates/welcome'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  try {
    const { userEmail, userName, userType } = req.body
    if (!userEmail || !userName || !userType) return res.status(400).json({ error: 'Faltan campos obligatorios' })
    if (!['client', 'host'].includes(userType)) return res.status(400).json({ error: 'userType debe ser client o host' })
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [userEmail],
      subject: userType === 'host' ? '🏡 Bienvenido a Lucky Vacations — Empieza a rifar tu propiedad' : '🎟️ Bienvenido a Lucky Vacations — Las mejores vacaciones te esperan',
      react: WelcomeEmail({ userName, userType }),
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true, emailId: data?.id })
  } catch (err) {
    console.error('[welcome]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
