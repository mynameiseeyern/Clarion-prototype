// Dummy data for the Clarity Fleet dashboard (Overview).
// Page-level data (endpoints/alerts/thresholds tables) is intentionally NOT
// modelled yet — those nav pages are placeholders for now.

export type Status = "healthy" | "warning" | "critical"

export interface LocationRow {
  id: string
  name: string
  status?: Status
  endpoints: number
  /** "issues" shown in the locations panel */
  issues: number
  /** active alerts contributing to the fleet KPI */
  activeAlerts: number
  /** status breakdown (counts sum to `endpoints`) */
  healthy: number
  warning: number
  critical: number
  /** Clarity Network Score 1.0–5.0 */
  score: number
}

export const fleet = {
  workspace: "Acme Contact Centre",
  product: "Clarity",
}

export const locations: LocationRow[] = [
  { id: "london", name: "London HQ", status: "healthy", endpoints: 612, issues: 0, activeAlerts: 0, healthy: 612, warning: 0, critical: 0, score: 4.41 },
  { id: "manilla", name: "Manila CC", status: "critical", endpoints: 1184, issues: 6, activeAlerts: 4, healthy: 1031, warning: 89, critical: 64, score: 3.52 },
  { id: "newyork", name: "New York", status: "warning", endpoints: 487, issues: 3, activeAlerts: 2, healthy: 441, warning: 38, critical: 8, score: 4.02 },
  { id: "bangalore", name: "Bangalore", status: "warning", endpoints: 346, issues: 2, activeAlerts: 1, healthy: 318, warning: 24, critical: 4, score: 4.11 },
  { id: "sydney", name: "Sydney", status: "healthy", endpoints: 218, issues: 0, activeAlerts: 0, healthy: 218, warning: 0, critical: 0, score: 4.36 },
]

export const DEFAULT_LOCATION = "sydney"

export interface FleetTotals {
  endpoints: number
  online: number
  healthy: number
  warning: number
  critical: number
  activeAlerts: number
  issues: number
  score: number
}

export function fleetTotals(): FleetTotals {
  const t = locations.reduce(
    (a, l) => ({
      endpoints: a.endpoints + l.endpoints,
      online: a.online + l.healthy + l.warning + l.critical,
      healthy: a.healthy + l.healthy,
      warning: a.warning + l.warning,
      critical: a.critical + l.critical,
      activeAlerts: a.activeAlerts + l.activeAlerts,
      issues: a.issues + l.issues,
    }),
    { endpoints: 0, online: 0, healthy: 0, warning: 0, critical: 0, activeAlerts: 0, issues: 0 }
  )
  const score = locations.reduce((s, l) => s + l.score * l.endpoints, 0) / t.endpoints
  return { ...t, score }
}

export function locationById(id: string) {
  return locations.find((l) => l.id === id)
}

// ---- Map markers -----------------------------------------------------------

export interface MapMarker {
  id: string
  status: Status
  x: number
  y: number
}

export const mapMarkers: MapMarker[] = [
  { id: "london", status: "healthy", x: 30, y: 34 },
  { id: "newyork", status: "warning", x: 47, y: 30 },
  { id: "bangalore", status: "warning", x: 58, y: 50 },
  { id: "manilla", status: "critical", x: 62, y: 50 },
  { id: "sydney", status: "healthy", x: 68, y: 78 },
]

// ---- Recent activity (per location, last 24h) ------------------------------

export interface RecentActivity {
  resolved: number
  avgTime: string
  autoFixed: number
}

const recentByLocation: Record<string, RecentActivity> = {
  london: { resolved: 5, avgTime: "14m", autoFixed: 4 },
  manilla: { resolved: 22, avgTime: "31m", autoFixed: 9 },
  newyork: { resolved: 11, avgTime: "19m", autoFixed: 6 },
  bangalore: { resolved: 8, avgTime: "24m", autoFixed: 5 },
  sydney: { resolved: 3, avgTime: "22m", autoFixed: 3 },
}

export function recentActivityFor(id: string): RecentActivity {
  return recentByLocation[id] ?? { resolved: 0, avgTime: "—", autoFixed: 0 }
}
