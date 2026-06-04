import { useEffect, useState } from "react"
import { fleetTotals, type FleetTotals } from "@/data/dashboard"

export interface LiveFleet extends FleetTotals {
  /** seconds since the last "stream" refresh */
  secondsAgo: number
}

const REFRESH_EVERY = 5 // seconds

/**
 * Simulates a live data stream: every REFRESH_EVERY seconds the online-endpoint
 * count and Clarity Network Score jitter slightly, and a "seconds ago" counter
 * ticks up each second, resetting on refresh.
 */
export function useStreaming(): LiveFleet {
  const base = fleetTotals()
  // `offline` is how many of the fleet aren't reporting right now, so online
  // can only ever dip BELOW total — never exceed it.
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [jitter, setJitter] = useState({ offline: 0, score: 0 })

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsAgo((s) => {
        const next = s + 1
        if (next >= REFRESH_EVERY) {
          // re-roll the stream
          setJitter({
            offline: Math.floor(Math.random() * 12),
            score: Math.round((Math.random() - 0.5) * 0.08 * 100) / 100,
          })
          return 0
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return {
    ...base,
    online: Math.max(0, Math.min(base.endpoints, base.online - jitter.offline)),
    score: Math.min(5, Math.max(1, base.score + jitter.score)),
    secondsAgo,
  }
}
