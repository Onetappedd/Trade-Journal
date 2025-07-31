import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-provider'
import { supabase } from '@/lib/supabaseClient'

export default function ProfilePage() {
  const { user } = useAuth()
  if (!user) return <p>Please log in to continue.</p>

  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error) setError(error)
      else setProfile(data)
    }
    fetchProfile()
  }, [user])

  if (error) return <p>Error loading profile: {error.message}</p>
  if (!profile) return <p>Loading profile...</p>

  return (
    <div>
      <h1>Welcome, {profile.name}!</h1>
      <p>Email: {profile.email}</p>
      {/* ...other profile fields... */}
    </div>
  )
}