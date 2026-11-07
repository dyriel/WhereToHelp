import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNearbyEvents } from '../hooks/useEvents'
import { haversine } from '../lib/haversine'
import Navbar from '../components/layout/Navbar'
import EventCard from '../components/events/EventCard'
import EventCardSkeleton from '../components/events/EventCardSkeleton'
import TagFilter from '../components/ui/TagFilter'
import { TYPE_TAGS, COMMITMENT_TAGS, TYPE_TAG_STYLES, COMMITMENT_TAG_STYLES } from '../constants/categories'

export default function Dashboard() {
  const { profile } = useAuth()
  const [typeTags,   setTypeTags]   = useState([])
  const [commitTags, setCommitTags] = useState([])

  const { data: events, isLoading, isError } = useNearbyEvents({
    lat: profile?.lat,
    lng: profile?.lng,
    typeTags,
    commitTags,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Volunteer events near {profile?.city}
          </p>
        </div>

        {/* Tag filters */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Type
            </p>
            <TagFilter
              tags={TYPE_TAGS}
              tagStyles={TYPE_TAG_STYLES}
              selected={typeTags}
              onChange={setTypeTags}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Commitment
            </p>
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
              Clear all filters
            </button>
          )}
        </div>

        {/* Events grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            Failed to load events. Please refresh the page.
          </div>
        ) : events?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No events found near you.</p>
            <Link
              to="/events/create"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Create the first one
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(events ?? []).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                distanceKm={
                  profile?.lat && profile?.lng
                    ? haversine(profile.lat, profile.lng, event.lat, event.lng)
                    : null
                }
              />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/browse" className="text-green-600 hover:underline text-sm">
            Browse all events →
          </Link>
        </div>
      </main>
    </div>
  )
}