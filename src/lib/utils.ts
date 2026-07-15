import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
