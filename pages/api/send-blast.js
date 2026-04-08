// pages/api/send-blast.js
// Envía email masivo a todos los participantes de una rifa específica

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { raffleId, subject, message, type } = req.body
  if (!raffleId || !subject || !message) {
    return res.status(400).json({ error: 'raffleId, subject y message son requeridos' })
  }

  try {
    // 1. Obtener la rifa
    const { data: raffle } = await supabaseAdmin
      .from('raffles')
      .select('*, properties(name, city, country)')
      .eq('id', raffleId)
      .single()

    if (!raffle) return res.status(404).json({ error: 'Rifa no encontrada' })

    // 2. Obtener todos los compradores únicos
    const { data: purchases } = await supabaseAdmin
      .from('purchases')
      .select('buyer_email, buyer_name, buyer_id, ticket_numbers, qty')
      .eq('raffle_id', raffleId)

    if (!purchases || purchases.length === 0) {
      return res.status(400).json({ error: 'No hay participantes en esta rifa' })
    }

    // Deduplicar por email
    const uniqueBuyers = {}
    purchases.forEach(p => {
      if (!uniqueBuyers[p.buyer_email]) {
        uniqueBuyers[p.buyer_email] = {
          email: p.buyer_email,
          name: p.buyer_name || 'Participante',
          tickets: [],
          qty: 0,
        }
      }
      uniqueBuyers[p.buyer_email].tickets.push(...(p.ticket_numbers || []))
      uniqueBuyers[p.buyer_email].qty += p.qty || 0
    })

    const buyers = Object.values(uniqueBuyers)
    const propertyName = raffle.properties?.name || raffle.slug
    const drawUrl = `https://luckyvaka.com/draw/${raffle.slug}`

    // 3. Enviar emails
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const ICONS = {
      reminder: '⏰',
      live: '🔴',
      update: '📢',
      urgent: '🚨',
    }
    const icon = ICONS[type] || '📢'

    let sent = 0
    let failed = 0

    for (const buyer of buyers) {
      try {
        await resend.emails.send({
          from: 'LuckyVaka <noreply@luckyvaka.com>',
          to: buyer.email,
          subject: `${icon} ${subject} — ${propertyName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #fff;">
              
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 28px;">
                <div style="display: inline-block; background: #1A6B3C; color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 16px;">
                  LUCKYVAKA
                </div>
                <div style="font-size: 32px; margin-bottom: 8px;">${icon}</div>
                <h1 style="font-size: 22px; font-weight: 800; color: #111; margin: 0 0 6px;">${subject}</h1>
                <p style="font-size: 14px; color: #6B7280; margin: 0;">${propertyName} · ${raffle.properties?.city || ''}</p>
              </div>

              <!-- Mensaje principal -->
              <div style="background: #F9FAFB; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; border-left: 4px solid #1A6B3C;">
                <p style="font-size: 14px; color: #374151; line-height: 1.7; margin: 0;">
                  Hola ${buyer.name},<br><br>
                  ${message}
                </p>
              </div>

              <!-- Info del participante -->
              <div style="background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em;">Tu participación</div>
                <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                  <div>
                    <div style="font-size: 10px; color: #9CA3AF;">Boletos</div>
                    <div style="font-size: 14px; font-weight: 700; color: #111;">${buyer.tickets.slice(0,5).map(n => `#${n}`).join(', ')}${buyer.tickets.length > 5 ? ` +${buyer.tickets.length - 5} más` : ''}</div>
                  </div>
                  <div>
                    <div style="font-size: 10px; color: #9CA3AF;">Fecha sorteo</div>
                    <div style="font-size: 14px; font-weight: 700; color: #111;">${raffle.draw_date ? new Date(raffle.draw_date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div>
                  </div>
                </div>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin-bottom: 28px;">
                <a href="${drawUrl}" style="display: inline-block; background: #1A6B3C; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px;">
                  Ver sorteo en vivo →
                </a>
              </div>

              <!-- Footer -->
              <div style="text-align: center; font-size: 11px; color: #9CA3AF; border-top: 1px solid #F3F4F6; padding-top: 20px;">
                LuckyVaka · luckyvaka.com<br>
                Recibes este correo porque participas en la rifa de ${propertyName}
              </div>
            </div>
          `
        })
        sent++
      } catch (e) {
        console.error(`Error enviando a ${buyer.email}:`, e)
        failed++
      }
    }

    return res.status(200).json({
      success: true,
      sent,
      failed,
      total: buyers.length,
      raffleName: propertyName,
    })

  } catch (error) {
    console.error('Error en send-blast:', error)
    return res.status(500).json({ error: 'Error interno al enviar emails' })
  }
}
