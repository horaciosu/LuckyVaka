// pages/api/execute-draw.js
// Ejecuta el sorteo de una rifa: elige ganador aleatorio, actualiza DB, envía email

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { raffleId } = req.body
  if (!raffleId) return res.status(400).json({ error: 'raffleId requerido' })

  try {
    // 1. Obtener la rifa con su propiedad
    const { data: raffle, error: raffleError } = await supabaseAdmin
      .from('raffles')
      .select('*, properties(name, city, country)')
      .eq('id', raffleId)
      .single()

    if (raffleError || !raffle) return res.status(404).json({ error: 'Rifa no encontrada' })
    if (raffle.status === 'completed') return res.status(400).json({ error: 'Esta rifa ya fue sorteada' })
    if (raffle.status === 'cancelled') return res.status(400).json({ error: 'Esta rifa está cancelada' })

    // 2. Obtener todas las compras de esta rifa
    const { data: purchases, error: purchasesError } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .eq('raffle_id', raffleId)

    if (purchasesError) throw purchasesError
    if (!purchases || purchases.length === 0) {
      return res.status(400).json({ error: 'No hay boletos vendidos para esta rifa' })
    }

    // 3. Construir pool de boletos vendidos
    const ticketPool = []
    purchases.forEach(p => {
      if (p.ticket_numbers && Array.isArray(p.ticket_numbers)) {
        p.ticket_numbers.forEach(n => ticketPool.push({ ticket: n, purchase: p }))
      }
    })

    if (ticketPool.length === 0) {
      return res.status(400).json({ error: 'No hay números de boleto registrados' })
    }

    // 4. Elegir ganador aleatorio (auditado)
    const winnerIndex = Math.floor(Math.random() * ticketPool.length)
    const winner = ticketPool[winnerIndex]
    const winnerTicket = winner.ticket
    const winnerPurchase = winner.purchase

    // 5. Actualizar la rifa con el ganador
    const { error: updateError } = await supabaseAdmin
      .from('raffles')
      .update({
        status: 'completed',
        winner_ticket: winnerTicket,
        winner_user_id: winnerPurchase.buyer_id,
      })
      .eq('id', raffleId)

    if (updateError) throw updateError

    // 6. Actualizar el status de la compra ganadora
    await supabaseAdmin
      .from('purchases')
      .update({ status: 'won' })
      .eq('raffle_id', raffleId)
      .eq('buyer_id', winnerPurchase.buyer_id)

    // 7. Enviar email al ganador via Resend
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'LuckyVaka <noreply@luckyvaka.com>',
        to: winnerPurchase.buyer_email,
        subject: `🏆 ¡Felicidades! Ganaste la rifa de ${raffle.properties?.name || 'la propiedad'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="font-size: 64px; margin-bottom: 16px;">🏆</div>
              <h1 style="font-size: 24px; font-weight: 800; color: #111; margin: 0 0 8px;">¡Felicidades, ${winnerPurchase.buyer_name || 'ganador'}!</h1>
              <p style="font-size: 15px; color: #6B7280; margin: 0;">Tu boleto número <strong style="color: #1A6B3C; font-size: 18px;">#${winnerTicket}</strong> ganó la rifa.</p>
            </div>
            
            <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
              <div style="font-size: 13px; font-weight: 700; color: #15803D; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Tu premio</div>
              <div style="font-size: 18px; font-weight: 700; color: #111; margin-bottom: 4px;">${raffle.properties?.name || 'Estancia'}</div>
              <div style="font-size: 14px; color: #6B7280;">📍 ${raffle.properties?.city || ''}, ${raffle.properties?.country || ''}</div>
              <div style="font-size: 14px; color: #6B7280; margin-top: 8px;">📅 Fecha de estancia: ${raffle.stay_date ? new Date(raffle.stay_date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div>
            </div>

            <div style="background: #FFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
              <div style="font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 12px;">¿Qué sigue?</div>
              <ol style="font-size: 13px; color: #6B7280; line-height: 2; margin: 0; padding-left: 20px;">
                <li>El equipo de LuckyVaka te contactará en las próximas 24 horas</li>
                <li>Confirmarás los detalles de tu estancia con el anfitrión</li>
                <li>¡Prepárate para disfrutar tu premio!</li>
              </ol>
            </div>

            <div style="text-align: center;">
              <a href="https://luckyvaka.com/dashboard?tab=won" style="background: #1A6B3C; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                Ver mi premio en el dashboard
              </a>
            </div>

            <div style="text-align: center; margin-top: 32px; font-size: 11px; color: #9CA3AF;">
              LuckyVaka · luckyvaka.com
            </div>
          </div>
        `
      })
    } catch (emailError) {
      console.error('Error enviando email ganador:', emailError)
      // No bloqueamos el proceso si el email falla
    }

    // 8. Retornar resultado del sorteo
    return res.status(200).json({
      success: true,
      winnerTicket,
      winnerName: winnerPurchase.buyer_name || 'Ganador',
      winnerEmail: winnerPurchase.buyer_email,
      winnerUserId: winnerPurchase.buyer_id,
      totalTickets: ticketPool.length,
      raffleName: raffle.properties?.name || raffle.slug,
    })

  } catch (error) {
    console.error('Error en execute-draw:', error)
    return res.status(500).json({ error: 'Error interno al ejecutar el sorteo' })
  }
}
