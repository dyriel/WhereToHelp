import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNearbyEvents } from '../hooks/useEvents'
import { geocodeAddress } from '../hooks/useGeocode'
import { haversine } from '../lib/haversine'
import Navbar from '../components/layout/Navbar'
import EventCard from '../components/events/EventCard'
import EventCardSkeleton from '../components/events/EventCardSkeleton'
import TagFilter from '../components/ui/TagFilter'
import { TYPE_TAGS, COMMITMENT_TAGS, TYPE_TAG_STYLES, COMMITMENT_TAG_STYLES } from '../constants/categories'

export default function Browse() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // Read initial filter values from URL, fall back to user's city
  const [locationInput, setLocationInput] = useState(
    searchParams.get('city') || profile?.city || ''
  )
  const [coords, setCoords]         = useState({ lat: profile?.lat, lng: profile?.lng })
  const [typeTags, setTypeTags]     = useState(
    searchParams.get('types') ? searchParams.get('types').split(',') : []
  )
  const [commitTags, setCommitTags] = useState(
    searchParams.get('commits') ? searchParams.get('commits').split(',') : []
  )
  const [sortBy, setSortBy]         = useState(searchParams.get('sort') || 'date_asc')
  const [dateFrom, setDateFrom]     = useState(
    searchParams.get('from') || new Date().toISOString().split('T')[0]
  )
  const [dateTo, setDateTo]         = useState(searchParams.get('to') || '')
  const [geoError, setGeoError]     = useState('')
  const [geoLoading, setGeoLoading] = useState(false)

  // Sync filters to URL whenever they change
  useEffect(() => {
    const params = {}
    if (locationInput) params.city    = locationInput
    if (typeTags.length)   params.types   = typeTags.join(',')
    if (commitTags.length) params.commits = commitTags.join(',')
    if (sortBy !== 'date_asc') params.sort = sortBy
    if (dateFrom) params.from = dateFrom
    if (dateTo)   params.to   = dateTo
    setSearchParams(params, { replace: true })
  }, [locationInput, typeTags, commitTags, sortBy, dateFrom, dateTo])

  // When profile loads, set initial coords if not already set
  useEffect(() => {
    if (profile && !coords.lat) {
      setCoords({ lat: profile.lat, lng: profile.lng })
      if (!locationInput) setLocationInput(profile.city)
    }
  }, [profile])

  // Geocode location input when user stops typing
  useEffect(() => {
    if (!locationInput) return
    const timer = setTimeout(async () => {
      setGeoLoading(true)
      setGeoError('')
      try {
        const result = await geocodeAddress(locationInput)
        setCoords({ lat: result.lat, lng: result.lng })
      } catch {
        setGeoError('Location not found. Try a different city name.')
      } finally {
        setGeoLoading(false)
      }
    }, 800) // debounce — wait 800ms after user stops typing

    return () => clearTimeout(timer) // cancel if user types again
  }, [locationInput])

  const { data: rawEvents, isLoading, isError } = useNearbyEvents({
    lat: coords.lat,
    lng: coords.lng,
    typeTags,
    commitTags,
  })

  // Apply date range and sort client-side
  const events = (rawEvents ?? [])
    .filter((e) => {
      if (dateFrom && e.date < dateFrom) return false
      if (dateTo   && e.date > dateTo)   return false
      return true
    })
    .map((e) => ({
      ...e,
      _distance: coords.lat
        ? haversine(coords.lat, coords.lng, e.lat, e.lng)
        : null
    }))
    .sort((a, b) => {
      if (sortBy === 'date_asc')      return a.date.localeCompare(b.date)
      if (sortBy === 'date_desc')     return b.date.localeCompare(a.date)
      if (sortBy === 'distance_asc')  return (a._distance ?? 0) - (b._distance ?? 0)
      if (sortBy === 'newest')        return new Date(b.created_at) - new Date(a.created_at)
      return 0
    })

  function clearAllFilters() {
    setTypeTags([])
    setCommitTags([])
    setSortBy('date_asc')
    setDateFrom(new Date().toISOString().split('T')[0])
    setDateTo('')
    setLocationInput(profile?.city || '')
    setCoords({ lat: profile?.lat, lng: profile?.lng })
  }

  const hasActiveFilters =
    typeTags.length > 0 || commitTags.length > 0 ||
    sortBy !== 'date_asc' || dateTo !== ''

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Browse Events</h1>
          <p className="text-gray-500 mt-1">Find volunteer opportunities anywhere</p>
        </div>

        {/* Filter panel */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm space-y-4">

          {/* Location + Sort row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Location
              </label>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Enter a city..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {geoLoading && <p className="text-xs text-gray-400 mt-1">Finding location...</p>}
              {geoError   && <p className="text-xs text-red-500 mt-1">{geoError}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="date_asc">Soonest First</option>
                <option value="date_desc">Latest First</option>
                <option value="distance_asc">Closest First</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>
          </div>

          {/* Date range row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Type tags */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</p>
            <TagFilter
              tags={TYPE_TAGS}
              tagStyles={TYPE_TAG_STYLES}
              selected={typeTags}
              onChange={setTypeTags}
            />
          </div>

          {/* Commitment tags */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Commitment</p>
            <TagFilter
              tags={COMMITMENT_TAGS}
              tagStyles={COMMITMENT_TAG_STYLES}
              selected={commitTags}
              onChange={setCommitTags}
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-green-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            Failed to load events. Please refresh.
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No events found.</p>
            <p className="text-gray-400 text-sm">Try a different location or clear your filters.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{events.length} event{events.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  distanceKm={event._distance}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}