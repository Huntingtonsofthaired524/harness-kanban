import { format } from 'date-fns'

export function checkTimestampPrecision(timestamp: number, unit: 'millisecond' | 'second'): boolean {
  if (unit === 'millisecond') {
    return timestamp >= 1000000000000 && timestamp < 10000000000000
  } else {
    return timestamp >= 1000000000 && timestamp < 10000000000
  }
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const YEAR = 12 * MONTH

export const formatRelativeDate = (timestamp: number): string => {
  const diff = Date.now() - timestamp

  if (diff >= 0 && diff < YEAR) {
    if (diff < HOUR) {
      const minutes = Math.max(Math.round(diff / MINUTE), 1)
      return `${minutes}m ago`
    } else if (diff < DAY) {
      const hours = Math.round(diff / HOUR)
      return `${hours}h ago`
    } else if (diff < MONTH) {
      const days = Math.round(diff / DAY)
      return `${days}d ago`
    } else {
      const months = Math.round(diff / MONTH)
      return `${months}mo ago`
    }
  }

  return format(new Date(timestamp), 'yyyy-MM-dd h:mm a')
}

export const formatDisplayDetailDate = (timestamp: number) => {
  return formatRelativeDate(timestamp)
}

export const formatDisplayDate = (timestamp: number) => {
  return format(new Date(timestamp), 'MMM d')
}
