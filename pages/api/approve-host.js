import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, action } = req.body
  const status = action === 'approve' ? 'approved' : 'rejected'

  try {
    // 1. Actualizar status en host_applications
    await supabaseAdmin
      .from('host_applications')
      .update({ status })
      .eq('user_id', userId)

    // 2. Si aprobado, asignar role=host en user_metadata
    if (action === 'approve') {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { role: 'host' }
      })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
