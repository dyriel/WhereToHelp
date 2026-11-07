import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMyRegistrations, useMyCreatedEvents } from '../hooks/useEvents'
import { haversine } from '../lib/haversine'
import { formatEventDate } from '../lib/format'
import Navbar from '../components/layout/Navbar'
import EventCard from '../components/events/EventCard'
import EventCardSkeleton from '../components/events/EventCardSkeleton'
import TagFilter from '../components/ui/TagFilter'
import { TYPE_TAGS, COMMITMENT_TAGS, TYPE_TAG_STYLES, COMMITMENT_TAG_STYLES } from '../constants/categories'
import { supabase } from '../lib/supabase'
import { geocodeAddress } from '../hooks/useGeocode'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const TABS = ['Upcoming', 'Past', 'Created']

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab]     = useState('Upcoming')
  const [typeTags, setTypeTags]       = useState([])
  const [commitTags, setCommitTags]   = useState([])
  const [editMode, setEditMode]       = useState(false)
  const [saving, setSaving]           = useState(false)

  const { data: registrations, isLoading: regLoading } = useMyRegistrations(user?.id)
  const { data: createdEvents, isLoading: createdLoading } = useMyCreatedEvents(user?.id)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: profile?.name, city: profile?.city }
  })

  // Split registrations into upcoming and past
  const today = new Date().toISOString().split('T')[0]
  const upcoming = (registrations ?? []).filter((e) => e.date >= today && !e.is_cancelled)
  const past     = (registrations ?? []).filter((e) => e.date < today  || e.is_cancelled)

  // Apply tag filters to whichever tab is active
  function applyTagFilters(events) {
    return (events ?? []).filter((e) => {
      const typeMatch   = typeTags.length === 0   || typeTags.includes(e.type_tag)
      const commitMatch = commitTags.length === 0  || commitTags.includes(e.commitment_tag)
      return typeMatch && commitMatch
    })
  }

  const tabEvents = {
    Upcoming: applyTagFilters(upcoming),
    Past:     applyTagFilters(past),
    Created:  applyTagFilters(createdEvents),
  }

  const isLoading = activeTab === 'Created' ? createdLoading : regLoading

  async function onSaveProfile(data) {
    setSaving(true)
    try {
      let lat = profile.lat
      let lng = profile.lng

      if (data.city !== profile.city) {
        const geo = await geocodeAddress(data.city)
        lat = geo.lat
        lng = geo.lng
      }

      const { error } = await supabase
        .from('profiles')
        .update({ name: data.name, city: data.city, lat, lng })
        .eq('id', user.id)

      if (error) throw error

      // Refresh profile in AuthContext
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      toast.success('Profile updated!')
      setEditMode(false)

      // Force a page reload so AuthContext re-fetches the profile
      window.location.reload()
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // Stats
  const totalJoined  = (registrations ?? []).length
  const totalCreated = (createdEvents ?? []).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Profile header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {editMode ? (
            <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Edit Profile</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  {...register('city', { required: 'City is required' })}
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar circle */}
                <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 font-bold text-xl flex items-center justify-center">
                  {profile?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{profile?.name}</h1>
                  <p className="text-gray-500 text-sm">📍 {profile?.city}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Member since {profile?.created_at
                      ? formatEventDate(profile.created_at.split('T')[0])
                      : '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditMode(true)}
                className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          )}

          {/* Stats bar */}
          {!editMode && (
            <div className="flex gap-8 mt-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totalJoined}</p>
                <p className="text-xs text-gray-500">Events Joined</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totalCreated}</p>
                <p className="text-xs text-gray-500">Events Created</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setTypeTags([]); setCommitTags([]) }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {tab === 'Upcoming' && upcoming.length > 0 && (
                <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                  {upcoming.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tag filters for current tab */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</p>
            <TagFilter
              tags={TYPE_TAGS}
              tagStyles={TYPE_TAG_STYLES}
              selected={typeTags}
              onChange={setTypeTags}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Commitment</p>
            <TagFilter
              tags={COMMITMENT_TAGS}
              tagStyles={COMMITMENT_TAG_STYLES}
              selected={commitTags}
              onChange={setCommitTags}
            />
          </div>
          {(typeTags.length > 0 || commitTags.length > 0) && (
            <button
              onClick={() => { setTypeTags([]); setCommitTags([]) }}
              className="text-xs text-green-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Tab content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : tabEvents[activeTab]?.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {activeTab === 'Upcoming' && 'No upcoming events. Browse events to join one!'}
            {activeTab === 'Past'     && 'No past events yet.'}
            {activeTab === 'Created'  && 'You haven\'t created any events yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tabEvents[activeTab].map((event) => (
              <EventCard
                key={event.id}
                event={event}
                distanceKm={
                  profile?.lat
                    ? haversine(profile.lat, profile.lng, event.lat, event.lng)
                    : null
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}