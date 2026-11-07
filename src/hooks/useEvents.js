import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Fetch events near a user's location with optional tag filters
export function useNearbyEvents({ lat, lng, typeTags = [], commitTags = [] }) {
  return useQuery({
    queryKey: ['events', 'nearby', lat, lng, typeTags, commitTags],
    enabled: !!lat && !!lng, // don't run if we don't have coordinates yet
    queryFn: async () => {
      const latMin = lat - 0.5
      const latMax = lat + 0.5
      const lngMin = lng - 0.5
      const lngMax = lng + 0.5

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          registrations(count)
        `)
        .gte('lat', latMin)
        .lte('lat', latMax)
        .gte('lng', lngMin)
        .lte('lng', lngMax)
        .gte('date', new Date().toISOString().split('T')[0])
        .eq('is_cancelled', false)
        .order('date', { ascending: true })

      if (error) throw error

      // Flatten the registration count onto each event
      return data.map((event) => ({
        ...event,
        reg_count: event.registrations[0]?.count || 0,
      }))
    },
    select: (data) => {
      // Apply tag filters client-side
      return data.filter((event) => {
        const typeMatch  = typeTags.length === 0  || typeTags.includes(event.type_tag)
        const commitMatch = commitTags.length === 0 || commitTags.includes(event.commitment_tag)
        return typeMatch && commitMatch
      })
    }
  })
}

// Fetch a single event by id
export function useEvent(id) {
  return useQuery({
    queryKey: ['events', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          registrations(count),
          profiles(name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        ...data,
        reg_count: data.registrations[0]?.count || 0,
        creator_name: data.profiles?.name,
      }
    }
  })
}

// Fetch events the current user has registered for
export function useMyRegistrations(userId) {
  return useQuery({
    queryKey: ['registrations', 'mine', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          events(
            *,
            registrations(count)
          )
        `)
        .eq('user_id', userId)
        .order('registered_at', { ascending: false })

      if (error) throw error

      return data.map((row) => ({
        ...row.events,
        reg_count: row.events.registrations[0]?.count || 0,
      }))
    }
  })
}

// Fetch events created by a user
export function useMyCreatedEvents(userId) {
  return useQuery({
    queryKey: ['events', 'created', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          registrations(count)
        `)
        .eq('creator_id', userId)
        .order('date', { ascending: false })

      if (error) throw error

      return data.map((event) => ({
        ...event,
        reg_count: event.registrations[0]?.count || 0,
      }))
    }
  })
}