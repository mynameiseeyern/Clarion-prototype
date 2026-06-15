// Dummy data for the Clarity Fleet dashboard (Overview).
// Locations are cities (centres) grouped into countries, so the map can cluster
// by country and drill down country → cities. Country aggregates and the fleet
// total (2,847 endpoints / 7 active alerts) are preserved across the split.

export type Status = "healthy" | "warning" | "critical"

export interface Country {
  id: string
  name: string
  /** approx position on the stylised world map, % of container */
  x: number
  y: number
}

export interface LocationRow {
  id: string
  name: string
  countryId: string
  status?: Status
  endpoints: number
  issues: number
  activeAlerts: number
  healthy: number
  warning: number
  critical: number
  /** endpoints not reporting (excluded from online) */
  offline: number
  score: number
  /** approx position on the stylised world map, % of container */
  x: number
  y: number
}

export const fleet = {
  workspace: "Acme Contact Centre",
  product: "Clarity",
}

export const countries: Country[] = [
  { id: "us", name: "United States", x: 26, y: 38 },
  { id: "gb", name: "United Kingdom", x: 47, y: 30 },
  { id: "in", name: "India", x: 67, y: 52 },
  { id: "ph", name: "Philippines", x: 78, y: 55 },
  { id: "au", name: "Australia", x: 82, y: 80 },
]

export const locations: LocationRow[] = [
  // United Kingdom
  { id: "london", name: "London HQ", countryId: "gb", status: "healthy", endpoints: 612, issues: 0, activeAlerts: 0, healthy: 608, warning: 0, critical: 0, offline: 4, score: 88, x: 46, y: 28 },
  // Philippines
  { id: "manilla", name: "Manila CC", countryId: "ph", status: "critical", endpoints: 800, issues: 4, activeAlerts: 3, healthy: 690, warning: 55, critical: 45, offline: 10, score: 64, x: 77, y: 53 },
  { id: "cebu", name: "Cebu", countryId: "ph", status: "warning", endpoints: 384, issues: 2, activeAlerts: 1, healthy: 326, warning: 34, critical: 19, offline: 5, score: 66, x: 79, y: 58 },
  // United States
  { id: "newyork", name: "New York", countryId: "us", status: "warning", endpoints: 240, issues: 2, activeAlerts: 1, healthy: 211, warning: 20, critical: 6, offline: 3, score: 75, x: 30, y: 36 },
  { id: "austin", name: "Austin", countryId: "us", status: "warning", endpoints: 140, issues: 1, activeAlerts: 1, healthy: 128, warning: 8, critical: 2, offline: 2, score: 78, x: 23, y: 42 },
  { id: "denver", name: "Denver", countryId: "us", status: "warning", endpoints: 107, issues: 1, activeAlerts: 1, healthy: 96, warning: 10, critical: 0, offline: 1, score: 77, x: 21, y: 38 },
  // India
  { id: "bangalore", name: "Bangalore", countryId: "in", status: "warning", endpoints: 220, issues: 1, activeAlerts: 1, healthy: 199, warning: 15, critical: 3, offline: 3, score: 79, x: 66, y: 54 },
  { id: "hyderabad", name: "Hyderabad", countryId: "in", status: "critical", endpoints: 126, issues: 1, activeAlerts: 1, healthy: 114, warning: 9, critical: 1, offline: 2, score: 80, x: 66, y: 50 },
  // Australia
  { id: "sydney", name: "Sydney", countryId: "au", status: "healthy", endpoints: 218, issues: 0, activeAlerts: 0, healthy: 216, warning: 0, critical: 0, offline: 2, score: 86, x: 84, y: 80 },
]

export const DEFAULT_LOCATION = "all"

export interface FleetTotals {
  endpoints: number
  online: number
  offline: number
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
      offline: a.offline + l.offline,
      healthy: a.healthy + l.healthy,
      warning: a.warning + l.warning,
      critical: a.critical + l.critical,
      activeAlerts: a.activeAlerts + l.activeAlerts,
      issues: a.issues + l.issues,
    }),
    { endpoints: 0, online: 0, offline: 0, healthy: 0, warning: 0, critical: 0, activeAlerts: 0, issues: 0 }
  )
  const score = locations.reduce((s, l) => s + l.score * l.endpoints, 0) / t.endpoints
  return { ...t, score }
}

export function locationById(id: string) {
  return locations.find((l) => l.id === id)
}

// ---- Countries (clusters of cities) ----------------------------------------

export function countryById(id: string) {
  return countries.find((c) => c.id === id)
}

export function citiesInCountry(countryId: string) {
  return locations.filter((l) => l.countryId === countryId)
}

export interface CountryStats extends Country {
  endpoints: number
  issues: number
  activeAlerts: number
  healthy: number
  warning: number
  critical: number
  offline: number
  status: Status
  cityCount: number
}

/** worst status among a country's cities */
function worstStatus(rows: LocationRow[]): Status {
  if (rows.some((r) => r.status === "critical")) return "critical"
  if (rows.some((r) => r.status === "warning")) return "warning"
  return "healthy"
}

export function countryStats(countryId: string): CountryStats | undefined {
  const c = countryById(countryId)
  if (!c) return undefined
  const cities = citiesInCountry(countryId)
  return {
    ...c,
    endpoints: cities.reduce((s, l) => s + l.endpoints, 0),
    issues: cities.reduce((s, l) => s + l.issues, 0),
    activeAlerts: cities.reduce((s, l) => s + l.activeAlerts, 0),
    healthy: cities.reduce((s, l) => s + l.healthy, 0),
    warning: cities.reduce((s, l) => s + l.warning, 0),
    critical: cities.reduce((s, l) => s + l.critical, 0),
    offline: cities.reduce((s, l) => s + l.offline, 0),
    status: worstStatus(cities),
    cityCount: cities.length,
  }
}

export function countriesWithStats(): CountryStats[] {
  return countries.map((c) => countryStats(c.id)!).filter(Boolean)
}

// ---- Recent activity (per location, last 24h) ------------------------------

export interface RecentActivity {
  resolved: number
  avgTime: string
  autoFixed: number
}

const recentByLocation: Record<string, RecentActivity> = {
  london: { resolved: 5, avgTime: "14m", autoFixed: 4 },
  manilla: { resolved: 18, avgTime: "31m", autoFixed: 7 },
  cebu: { resolved: 9, avgTime: "27m", autoFixed: 4 },
  newyork: { resolved: 7, avgTime: "19m", autoFixed: 4 },
  austin: { resolved: 4, avgTime: "16m", autoFixed: 3 },
  denver: { resolved: 3, avgTime: "15m", autoFixed: 2 },
  bangalore: { resolved: 6, avgTime: "24m", autoFixed: 4 },
  hyderabad: { resolved: 4, avgTime: "21m", autoFixed: 2 },
  sydney: { resolved: 3, avgTime: "22m", autoFixed: 3 },
}

export function recentActivityFor(id: string): RecentActivity {
  return recentByLocation[id] ?? { resolved: 0, avgTime: "—", autoFixed: 0 }
}
