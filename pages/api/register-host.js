import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { body, name, email, userId } = req.body

  try {
    // 1. Guardar solicitud en host_applications
    const { error: dbError } = await supabaseAdmin
      .from('host_applications')
      .upsert({
        user_id: userId,
        full_name: name,
        email: email,
        status: 'pending',
        data: body,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (dbError) console.error('DB error:', dbError)

    // 2. Notificar por email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LuckyVaka <noreply@luckyvaka.com>',
        to: ['luckyvaka.hola@gmail.com'],
        subject: `🏠 Nueva solicitud de anfitrión: ${name}`,
        text: body,
        reply_to: email,
      }),
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error:', err)
    return res.status(200).json({ ok: true })
  }
}
