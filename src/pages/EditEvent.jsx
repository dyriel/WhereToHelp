import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { useEvent } from '../hooks/useEvents'
import { supabase } from '../lib/supabase'
import { geocodeAddress } from '../hooks/useGeocode'
import Navbar from '../components/layout/Navbar'
import { TYPE_TAGS, COMMITMENT_TAGS, TYPE_TAG_STYLES, COMMITMENT_TAG_STYLES } from '../constants/categories'
import toast from 'react-hot-toast'
import { useState } from 'react'

const STEPS = ['Basic Info', 'Location & Time', 'Review & Submit']

export default function EditEvent() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: event, isLoading } = useEvent(id)

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors }
  } = useForm()

  const watched = watch()

  // Pre-fill form once event data loads
  useEffect(() => {
    if (!event) return

    // Guard: redirect if not creator or event is cancelled
    if (event.creator_id !== user?.id) {
      toast.error('You are not the creator of this event')
      navigate(`/events/${id}`)
      return
    }
    if (event.is_cancelled) {
      toast.error('Cannot edit a cancelled event')
      navigate(`/events/${id}`)
      return
    }

    // Pre-fill all form fields with existing data
    reset({
      title:           event.title,
      description:     event.description,
      type_tag:        event.type_tag,
      commitment_tag:  event.commitment_tag,
      address:         event.address,
      city:            event.city,
      date:            event.date,
      start_time:      event.start_time?.slice(0, 5), // trim seconds from "HH:mm:ss"
      end_time:        event.end_time?.slice(0, 5),
      max_volunteers:  event.max_volunteers || '',
    })
  }, [event, user])

  const stepFields = [
    ['title', 'description', 'type_tag', 'commitment_tag'],
    ['address', 'city', 'date', 'start_time', 'end_time'],
    [],
  ]

  async function handleNext() {
    const valid = await trigger(stepFields[step])
    if (valid) setStep((s) => s + 1)
  }

  async function onSubmit(data) {
    setIsSubmitting(true)
    try {
      // Validate max_volunteers isn't lower than current reg count
      if (data.max_volunteers && parseInt(data.max_volunteers) < event.reg_count) {
        toast.error(`You already have ${event.reg_count} registered volunteers`)
        setIsSubmitting(false)
        return
      }

      // Re-geocode only if address or city changed
      let lat = event.lat
      let lng = event.lng
      if (data.address !== event.address || data.city !== event.city) {
        const geo = await geocodeAddress(`${data.address}, ${data.city}`)
        lat = geo.lat
        lng = geo.lng
      }

      const { error } = await supabase
        .from('events')
        .update({
          title:          data.title,
          description:    data.description,
          type_tag:       data.type_tag,
          commitment_tag: data.commitment_tag,
          address:        data.address,
          city:           data.city,
          lat,
          lng,
          date:           data.date,
          start_time:     data.start_time,
          end_time:       data.end_time,
          max_volunteers: data.max_volunteers ? parseInt(data.max_volunteers) : null,
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Event updated!')
      navigate(`/events/${id}`)
    } catch (err) {
      toast.error(err.message || 'Failed to update event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const typeTag   = TYPE_TAGS.find((t) => t.value === watched.type_tag)
  const commitTag = COMMITMENT_TAGS.find((t) => t.value === watched.commitment_tag)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-2">
          <Link to={`/events/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Event
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Event</h1>
        <p className="text-gray-500 mb-8">Update the details for your event.</p>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 transition-colors ${
                i < step   ? 'bg-green-600 border-green-600 text-white' :
                i === step ? 'border-green-600 text-green-600' :
                             'border-gray-300 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i === step ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ── Step 1: Basic Info ── */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <span className="text-xs text-gray-400">{watched.title?.length || 0}/80</span>
                  </div>
                  <input
                    type="text"
                    maxLength={80}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    {...register('title', { required: 'Title is required' })}
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <span className="text-xs text-gray-400">{watched.description?.length || 0}/1000</span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    {...register('description', { required: 'Description is required' })}
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TYPE_TAGS.map((tag) => {
                      const style = TYPE_TAG_STYLES[tag.color]
                      const isSelected = watched.type_tag === tag.value
                      return (
                        <button
                          type="button"
                          key={tag.value}
                          onClick={() => setValue('type_tag', tag.value, { shouldValidate: true })}
                          className={`text-sm px-3 py-2 rounded-lg border transition-colors text-left ${
                            isSelected
                              ? `${style.badge} border-transparent font-medium`
                              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {tag.icon} {tag.label}
                        </button>
                      )
                    })}
                  </div>
                  <input type="hidden" {...register('type_tag', { required: 'Please select a type' })} />
                  {errors.type_tag && <p className="text-red-500 text-xs mt-1">{errors.type_tag.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commitment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {COMMITMENT_TAGS.map((tag) => {
                      const isSelected = watched.commitment_tag === tag.value
                      return (
                        <button
                          type="button"
                          key={tag.value}
                          onClick={() => setValue('commitment_tag', tag.value, { shouldValidate: true })}
                          className={`text-sm px-3 py-2 rounded-lg border transition-colors text-left ${
                            isSelected
                              ? `${COMMITMENT_TAG_STYLES[tag.color]} border-transparent font-medium`
                              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {tag.icon} {tag.label}
                        </button>
                      )
                    })}
                  </div>
                  <input type="hidden" {...register('commitment_tag', { required: 'Please select a commitment type' })} />
                  {errors.commitment_tag && <p className="text-red-500 text-xs mt-1">{errors.commitment_tag.message}</p>}
                </div>
              </div>
            )}

            {/* ── Step 2: Location & Time ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    {...register('address', { required: 'Address is required' })}
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    {...register('date', { required: 'Date is required' })}
                  />
                  {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      {...register('start_time', { required: 'Start time is required' })}
                    />
                    {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      {...register('end_time', {
                        required: 'End time is required',
                        validate: (val) =>
                          val > getValues('start_time') || 'End time must be after start time'
                      })}
                    />
                    {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Review & Submit ── */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-900">Review your changes</h2>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Title</p>
                    <p className="font-medium text-gray-900">{watched.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
                    <p className="text-gray-700">{watched.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {typeTag && (
                      <span className={`text-xs px-2 py-1 rounded-full ${TYPE_TAG_STYLES[typeTag.color]?.badge}`}>
                        {typeTag.icon} {typeTag.label}
                      </span>
                    )}
                    {commitTag && (
                      <span className={`text-xs px-2 py-1 rounded-full ${COMMITMENT_TAG_STYLES[commitTag.color]}`}>
                        {commitTag.icon} {commitTag.label}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                    <p className="text-gray-700">{watched.address}, {watched.city}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Date & Time</p>
                    <p className="text-gray-700">{watched.date} · {watched.start_time} – {watched.end_time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Max Volunteers</p>
                    <p className="text-gray-700">{watched.max_volunteers || 'Unlimited'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Volunteers <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  {event?.reg_count > 0 && (
                    <p className="text-xs text-gray-400 mb-1">
                      Cannot be lower than current registrations ({event.reg_count})
                    </p>
                  )}
                  <input
                    type="number"
                    min={event?.reg_count || 1}
                    placeholder="Leave blank for unlimited"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    {...register('max_volunteers', {
                      min: { value: event?.reg_count || 1, message: `Must be at least ${event?.reg_count || 1}` }
                    })}
                  />
                  {errors.max_volunteers && <p className="text-red-500 text-xs mt-1">{errors.max_volunteers.message}</p>}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}