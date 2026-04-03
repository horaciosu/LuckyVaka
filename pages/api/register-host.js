// pages/api/register-host.js
// Sends host registration data to luckyvaka.hola@gmail.com via Resend

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { body, name, email } = req.body

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lucky Vaka <onboarding@resend.dev>',
        to: ['luckyvaka.hola@gmail.com'],
        subject: `🏡 Nuevo anfitrión registrado: ${name}`,
        text: body,
        reply_to: email,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend error:', error)
      // Still return success to user — we log the data
      console.log('HOST REGISTRATION DATA:\n', body)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Email error:', err)
    // Log data even if email fails
    console.log('HOST REGISTRATION DATA:\n', body)
    return res.status(200).json({ ok: true })
  }
}
