import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useAuth } from '../context/AuthContext'
import { useEvent } from '../hooks/useEvents'
import { useIsRegistered, useJoinEvent, useLeaveEvent } from '../hooks/useRegistrations'
import { supabase } from '../lib/supabase'
import { formatEventDate, formatEventTime } from '../lib/format'
import { TYPE_TAGS, COMMITMENT_TAGS, TYPE_TAG_STYLES, COMMITMENT_TAG_STYLES } from '../constants/categories'
import Navbar from '../components/layout/Navbar'
import toast from 'react-hot-toast'

// Fix Leaflet's default marker icon (it breaks with Vite)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function EventDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const { data: event, isLoading, isError } = useEvent(id)
  const { data: registration } = useIsRegistered(id, user?.id)
  const joinEvent  = useJoinEvent()
  const leaveEvent = useLeaveEvent()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-40 text-gray-500">
          Event not found. <Link to="/browse" className="text-green-600 hover:underline">Browse events</Link>
        </div>
      </div>
    )
  }

  const typeTag   = TYPE_TAGS.find((t) => t.value === event.type_tag)
  const commitTag = COMMITMENT_TAGS.find((t) => t.value === event.commitment_tag)
  const cardStyle = TYPE_TAG_STYLES[typeTag?.color] || TYPE_TAG_STYLES.gray

  const isCreator    = user?.id === event.creator_id
  const isRegistered = !!registration
  const isFull       = event.max_volunteers && event.reg_count >= event.max_volunteers
  const isPast       = new Date(event.date) < new Date(new Date().toDateString())

  async function handleCancelEvent() {
    setCancelling(true)
    const { error } = await supabase
      .from('events')
      .update({ is_cancelled: true })
      .eq('id', event.id)

    if (error) {
      toast.error('Failed to cancel event')
    } else {
      toast.success('Event cancelled')
      setShowCancelModal(false)
      navigate('/dashboard')
    }
    setCancelling(false)
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Colored header band */}
      <div className={`h-3 ${cardStyle.card.split(' ')[0]} border-b-4 ${cardStyle.card.split(' ')[1]}`} />

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Back link */}
        <Link to="/browse" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
          ← Back to Browse
        </Link>

        {/* Tags + status */}
        <div className="flex flex-wrap gap-2 mb-4">
          {typeTag && (
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${cardStyle.badge}`}>
              {typeTag.icon} {typeTag.label}
            </span>
          )}
          {commitTag && (
            <span className={`text-sm px-3 py-1 rounded-full ${COMMITMENT_TAG_STYLES[commitTag.color]}`}>
              {commitTag.icon} {commitTag.label}
            </span>
          )}
          {event.is_cancelled && (
            <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
              Cancelled
            </span>
          )}
          {isPast && !event.is_cancelled && (
            <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
              Past
            </span>
          )}
          {isFull && !isPast && !event.is_cancelled && (
            <span className="text-sm px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
              Full
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">{event.title}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column — details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3">About this event</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-gray-900">Details</h2>
              <div className="flex items-start gap-3 text-sm">
                <span className="text-xl">📅</span>
                <div>
                  <p className="font-medium text-gray-900">{formatEventDate(event.date)}</p>
                  <p className="text-gray-500">{formatEventTime(event.start_time)} – {formatEventTime(event.end_time)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="text-xl">📍</span>
                <div>
                  <p className="font-medium text-gray-900">{event.address}</p>
                  <p className="text-gray-500">{event.city}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="text-xl">👥</span>
                <p className="text-gray-700">
                  {event.reg_count} volunteer{event.reg_count !== 1 ? 's' : ''} registered
                  {event.max_volunteers ? ` (max ${event.max_volunteers})` : ''}
                </p>
              </div>
              {event.creator_name && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-xl">🙋</span>
                  <p className="text-gray-700">Organized by <span className="font-medium">{event.creator_name}</span></p>
                </div>
              )}
            </div>

            {/* Leaflet map */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <MapContainer
                center={[event.lat, event.lng]}
                zoom={15}
                style={{ height: '250px', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap contributors"
                />
                <Marker position={[event.lat, event.lng]}>
                  <Popup>{event.title}<br />{event.address}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* Right column — action sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4 lg:sticky lg:top-6">

              {/* Registration button logic */}
              {event.is_cancelled ? (
                <div className="w-full text-center py-2 px-4 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
                  This event has been cancelled
                </div>
              ) : isPast ? (
                <div className="w-full text-center py-2 px-4 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium">
                  This event has ended
                </div>
              ) : isCreator ? (
                <div className="space-y-2">
                  <Link
                    to={`/events/${event.id}/edit`}
                    className="block w-full text-center py-2 px-4 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Edit Event
                  </Link>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="block w-full text-center py-2 px-4 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Cancel Event
                  </button>
                </div>
              ) : isRegistered ? (
                <button
                  onClick={() => leaveEvent.mutate({ eventId: event.id, userId: user.id })}
                  disabled={leaveEvent.isPending}
                  className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {leaveEvent.isPending ? 'Leaving...' : 'Leave Event'}
                </button>
              ) : isFull ? (
                <div className="w-full text-center py-2 px-4 rounded-lg bg-orange-50 text-orange-600 text-sm font-medium">
                  This event is full
                </div>
              ) : (
                <button
                  onClick={() => joinEvent.mutate({ eventId: event.id, userId: user.id })}
                  disabled={joinEvent.isPending}
                  className="w-full py-2 px-4 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {joinEvent.isPending ? 'Joining...' : 'Join Event'}
                </button>
              )}

              {isRegistered && !isCreator && !isPast && !event.is_cancelled && (
                <p className="text-xs text-center text-green-600">✓ You're registered for this event</p>
              )}

              {/* Share button */}
              <button
                onClick={handleShare}
                className="w-full py-2 px-4 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                Share Event 🔗
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel this event?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This cannot be undone. All registered volunteers will lose their spot.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
              >
                Keep Event
              </button>
              <button
                onClick={handleCancelEvent}
                disabled={cancelling}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}