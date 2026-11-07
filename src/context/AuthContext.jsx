import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { geocodeAddress } from '../hooks/useGeocode'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch the profile row from our profiles table
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error) setProfile(data)
  }

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) ensureProfile(session.user)
      setLoading(false)
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) ensureProfile(session.user)
        else setProfile(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  //Creates the profile row on first login if it doesn't exist yet
  async function ensureProfile(user) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

      if (existing) {
        setProfile(existing)
        return
      }

      // First login after email confirmation
      const meta = user.user_metadata
      const { data: created, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: meta.name,
          city: meta.city,
          lat: meta.lat,
          lng: meta.lng,
        })
        .select()
        .single()
      
      if (!error) setProfile(created)
  }

  async function signUp(email, password, name, city) {
    // 1. Geocode the city first so we can store lat/lng
    const geo = await geocodeAddress(city)

    // 2. Create the auth user and store name/city/geo temporarily
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { name, city, lat: geo.lat, lng: geo.lng}
      } 
    })
    if (error) throw error
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for easy access
export function useAuth() {
  return useContext(AuthContext)
}