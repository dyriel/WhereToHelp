import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

// Check if the current user is registered for a specific event
export function useIsRegistered(eventId, userId) {
  return useQuery({
    queryKey: ['registrations', eventId, userId],
    enabled: !!eventId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return data
    }
  })
}

export function useJoinEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, userId }) => {
      const { error } = await supabase
        .from('registrations')
        .insert({ event_id: eventId, user_id: userId })
      if (error) throw error
    },
    onSuccess: (_, { eventId, userId }) => {
      toast.success('Joined event!')
      queryClient.invalidateQueries({ queryKey: ['events', eventId] })
      queryClient.invalidateQueries({ queryKey: ['registrations', eventId, userId] })
      queryClient.invalidateQueries({ queryKey: ['registrations', 'mine', userId] })
      queryClient.invalidateQueries({ queryKey: ['events', 'nearby'] })
    },
    onError: () => toast.error('Failed to join event')
  })
}

export function useLeaveEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, userId }) => {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: (_, { eventId, userId }) => {
      toast.success('Left event')
      queryClient.invalidateQueries({ queryKey: ['events', eventId] })
      queryClient.invalidateQueries({ queryKey: ['registrations', eventId, userId] })
      queryClient.invalidateQueries({ queryKey: ['registrations', 'mine', userId] })
      queryClient.invalidateQueries({ queryKey: ['events', 'nearby'] })
    },
    onError: () => toast.error('Failed to leave event')
  })
}