import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Human "last seen" phrasing from a minutes-ago value: "45 minutes ago", "13 hours ago", "2 days ago". */
export function formatLastSeen(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m < 1) return "moments ago"
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d === 1 ? "" : "s"} ago`
}

/** Humanise a minutes-ago value into a compact unit: m (min), h (hour), d (day), mo (month). */
export function formatAgo(minutes: number): string {
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))}m`
  const hours = minutes / 60
  if (hours < 24) return `${Math.floor(hours)}h`
  const days = hours / 24
  if (days < 30) return `${Math.floor(days)}d`
  return `${Math.floor(days / 30)}mo`
}
