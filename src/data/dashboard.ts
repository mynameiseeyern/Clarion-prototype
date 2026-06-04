// Mock data for the Clarity Fleet "Overview" dashboard.
// Mirrors the Figma "Fleet Dashboard — Look and Feel" frame.

export type Status = "healthy" | "warning" | "critical"

export interface LocationRow {
  id: string
  name: string
  status?: Status
  endpoints: number
  issues: number
  selected?: boolean
}

export const fleet = {
  workspace: "Acme Contact Centre",
  product: "Clarity",
  totalEndpoints: 2847,
  onlineEndpoints: 1847,
  activeAlerts: 7,
  mosScore: 4.12,
  selectedLocation: "Sydney",
}

export const locations: LocationRow[] = [
  { id: "all", name: "All locations", endpoints: 2847, issues: 11 },
  { id: "london", name: "London HQ", status: "healthy", endpoints: 612, issues: 0 },
  { id: "manilla", name: "Manilla CC", status: "critical", endpoints: 1184, issues: 6 },
  { id: "newyork", name: "New York", status: "warning", endpoints: 487, issues: 3 },
  { id: "bangalore", name: "Bangalore", status: "warning", endpoints: 346, issues: 2 },
  { id: "sydney", name: "Sydney", status: "healthy", endpoints: 218, issues: 0, selected: true },
]

// Approximate map marker positions (percent of the map container).
export interface MapMarker {
  id: string
  status: Status
  x: number
  y: number
  label?: string
  count?: number
  active?: boolean
}

export const mapMarkers: MapMarker[] = [
  { id: "london", status: "warning", x: 30, y: 34 },
  { id: "newyork", status: "healthy", x: 47, y: 30 },
  { id: "bangalore", status: "warning", x: 58, y: 50 },
  { id: "manilla", status: "critical", x: 62, y: 50 },
  { id: "sydney", status: "healthy", x: 68, y: 78, label: "Sydney", count: 218, active: true },
]

export interface RecentActivity {
  id: string
  label: string
  value: string
  icon: "resolved" | "time" | "auto"
}

export const recentActivity: RecentActivity[] = [
  { id: "resolved", label: "Resolved", value: "3", icon: "resolved" },
  { id: "avg", label: "Average time", value: "22m", icon: "time" },
  { id: "auto", label: "Auto-fixed", value: "22m", icon: "auto" },
]
