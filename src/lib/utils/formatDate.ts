import { format, formatDistanceToNowStrict } from 'date-fns'

export function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: string): string {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a')
}

export function timeAgo(date: string): string {
  return `${formatDistanceToNowStrict(new Date(date), {
    addSuffix: false,
  })} ago`
}
