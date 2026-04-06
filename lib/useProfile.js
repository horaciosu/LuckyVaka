import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (!error) setProfile(data)
    return { data, error }
  }

  const uploadAvatar = async (file) => {
    if (!userId) return { error: 'No user' }
    if (file.size > 5 * 1024 * 1024) return { error: 'Max 5MB' }

    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) return { error: uploadError.message }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    const avatarUrl = urlData.publicUrl + '?t=' + Date.now()
    await updateProfile({ avatar_url: avatarUrl })
    return { url: avatarUrl }
  }

  return { profile, loading, updateProfile, uploadAvatar, reload: loadProfile }
}
