import { format, parse } from 'date-fns'

export function formatEventDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return format(date, 'EEE, MMM d, yyyy')
}

export function formatEventTime(timeStr) {
  const time = parse(timeStr, 'HH:mm:ss', new Date())
  return format(time, 'h:mm a')
}