import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { raffle_slug, ticket_numbers, buyer_email, buyer_name, qty, buyer_id, total_paid } = req.body

  if (!raffle_slug || !ticket_numbers?.length || !buyer_email) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // 1. Obtener rifa actual
  const { data: raffle, error: fetchError } = await supabase
    .from('raffles')
    .select('id, total_tickets, tickets_sold, sold_tickets, min_tickets, status, currency')
    .eq('slug', raffle_slug)
    .single()

  if (fetchError || !raffle) {
    return res.status(404).json({ error: 'Raffle not found' })
  }

  if (raffle.status !== 'active') {
    return res.status(400).json({ error: 'Raffle is not active' })
  }

  const currentSold = raffle.sold_tickets || []

  // 2. Verificar que los números no estén tomados
  const conflict = ticket_numbers.filter((n: number) => currentSold.includes(n))
  if (conflict.length > 0) {
    return res.status(409).json({ error: 'Some tickets already taken', conflict })
  }

  // 3. Verificar que los números sean válidos
  const invalid = ticket_numbers.filter((n: number) => n < 1 || n > raffle.total_tickets)
  if (invalid.length > 0) {
    return res.status(400).json({ error: 'Invalid ticket numbers', invalid })
  }

  // 4. Actualizar sold_tickets y tickets_sold
  const newSoldTickets = [...currentSold, ...ticket_numbers]
  const newTicketsSold = (raffle.tickets_sold || 0) + ticket_numbers.length

  const { error: updateError } = await supabase
    .from('raffles')
    .update({
      sold_tickets: newSoldTickets,
      tickets_sold: newTicketsSold,
    })
    .eq('id', raffle.id)

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update raffle', detail: updateError.message })
  }

  // 5. Guardar registro de compra en tabla purchases (si existe)
  // Si no tienes tabla purchases aún, esta parte se puede omitir
  const { error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      raffle_id: raffle.id,
      raffle_slug,
      buyer_id: buyer_id || null,
      buyer_email,
      buyer_name: buyer_name || '',
      ticket_numbers,
      qty: ticket_numbers.length,
      total_paid: total_paid || null,
      currency: raffle.currency || 'MXN',
      status: 'confirmed',
    })
    .select()
    .single()

  // No fallar si no existe la tabla purchases todavía
  if (purchaseError) {
    console.warn('purchases table not available:', purchaseError.message)
  }

  return res.status(200).json({
    success: true,
    ticket_numbers,
    message: 'Purchase confirmed',
  })
}
