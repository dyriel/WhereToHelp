import { Link } from 'react-router-dom'
import { TYPE_TAGS, COMMITMENT_TAGS, TYPE_TAG_STYLES, COMMITMENT_TAG_STYLES } from '../../constants/categories'
import { formatEventDate, formatEventTime } from '../../lib/format'
import { formatDistance } from '../../lib/haversine'

export default function EventCard({ event, distanceKm }) {
  const typeTag = TYPE_TAGS.find((t) => t.value === event.type_tag)
  const commitTag = COMMITMENT_TAGS.find((t) => t.value === event.commitment_tag)
  const cardStyle = TYPE_TAG_STYLES[typeTag?.color] || TYPE_TAG_STYLES.gray

  const regCount = event.reg_count || 0
  const isFull = event.max_volunteers && regCount >= event.max_volunteers
  const isPast = new Date(event.date) < new Date(new Date().toDateString())

  return (
    <Link
      to={`/events/${event.id}`}
      className={`block rounded-xl border-l-4 p-4 hover:shadow-md transition-shadow ${cardStyle.card}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${cardStyle.badge}`}>
          {typeTag?.icon} {typeTag?.label}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${COMMITMENT_TAG_STYLES[commitTag?.color]}`}>
          {commitTag?.icon} {commitTag?.label}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{event.title}</h3>

      <p className="text-sm text-gray-500 mb-2">
        {formatEventDate(event.date)} · {formatEventTime(event.start_time)}
      </p>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {event.city}{distanceKm != null && ` · ${formatDistance(distanceKm)}`}
        </span>

        {event.is_cancelled ? (
          <span className="text-red-600 font-medium">Cancelled</span>
        ) : isPast ? (
          <span className="text-gray-400 font-medium">Past</span>
        ) : isFull ? (
          <span className="text-orange-600 font-medium">Full</span>
        ) : (
          <span className="text-gray-600">
            {regCount}{event.max_volunteers ? ` / ${event.max_volunteers}` : ''} volunteers
          </span>
        )}
      </div>
    </Link>
  )
}