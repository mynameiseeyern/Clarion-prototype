// Generated endpoint dataset for the Endpoints page.
// All 2,847 endpoints, with per-location healthy/warning/critical counts
// matching the Overview exactly, seeded so it's stable across renders.

import { locations, type Status } from "./dashboard"

export type Connection = "Ethernet" | "Wi-Fi"
export type Site = "Office" | "Remote"
export type Platform = "Genesys Cloud" | "Microsoft Teams" | "Zoom" | "Webex"

export interface Endpoint {
  id: string
  user: string
  machine: string
  locationId: string
  locationName: string
  site: Site
  status: Status
  /** Clarity Network Score 1.0–5.0, or null when unreachable */
  score: number | null
  connection: Connection
  latency: number
  jitter: number
  packetLoss: number
  isp: string
  ip: string
  team: string
  primaryPlatform: Platform
  /** derived one-line "why" for the table; null when healthy */
  primaryIssue: string | null
}

// ---- generation inputs -----------------------------------------------------

const prefix: Record<string, string> = {
  london: "LDN", manilla: "MNL", newyork: "NYC", bangalore: "BLR", sydney: "SYD",
}
const isps: Record<string, string[]> = {
  london: ["BT", "Virgin Media"],
  manilla: ["PLDT", "Globe"],
  newyork: ["Verizon", "Comcast"],
  bangalore: ["ACT Fibernet", "Airtel"],
  sydney: ["Telstra", "Optus"],
}
const teams = [
  "Customer Support · Tier 1", "Customer Support · Tier 2", "Customer Support · Tier 3",
  "Sales", "Technical Support", "Retentions", "Onboarding",
]
const platforms: Platform[] = ["Genesys Cloud", "Microsoft Teams", "Zoom", "Webex"]
const firstNames = [
  "Anna", "Luis", "Sarah", "James", "Priya", "Tom", "Rahul", "Maria", "David", "Mei",
  "Omar", "Grace", "Chen", "Sofia", "Liam", "Aisha", "Noah", "Elena", "Raj", "Hana",
  "Diego", "Yuki", "Ivan", "Nora", "Sam", "Lena", "Carlos", "Fatima", "Jack", "Zara",
]
const lastNames = [
  "Reyes", "Mendoza", "Kim", "Carter", "Menon", "Wilson", "Sharma", "Santos", "Lee", "Tan",
  "Khan", "Okafor", "Wang", "Garcia", "Murphy", "Patel", "Brown", "Rossi", "Singh", "Sato",
  "Lopez", "Nakamura", "Petrov", "Hughes", "Cohen", "Novak", "Cruz", "Ali", "Walsh", "Haddad",
]

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(1337)
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const between = (min: number, max: number) => min + rand() * (max - min)
const round = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d

function deriveIssue(
  status: Status,
  conn: Connection,
  latency: number,
  jitter: number,
  loss: number,
  downPlatform: Platform | null
): string | null {
  if (status === "healthy") return null
  if (downPlatform) return `${downPlatform} down`
  // choose worst offender relative to its critical threshold
  const candidates = [
    { label: conn === "Wi-Fi" ? `Wi-Fi · jitter ${jitter}ms` : `Jitter ${jitter}ms`, sev: jitter / 50 },
    { label: `Latency ${latency}ms`, sev: latency / 150 },
    { label: `Packet loss ${loss}%`, sev: loss / 3 },
  ]
  candidates.sort((a, b) => b.sev - a.sev)
  return candidates[0].label
}

function makeEndpoint(locId: string, locName: string, status: Status, n: number): Endpoint {
  const site: Site = rand() > 0.5 ? "Office" : "Remote"
  const connection: Connection = site === "Office" ? (rand() > 0.15 ? "Ethernet" : "Wi-Fi") : "Wi-Fi"
  let latency: number, jitter: number, loss: number, score: number | null
  let downPlatform: Platform | null = null

  if (status === "healthy") {
    latency = round(between(8, 70)); jitter = round(between(4, 20)); loss = round(between(0, 0.6), 1)
    score = round(between(4.0, 4.8), 1)
  } else if (status === "warning") {
    // one metric in the warn band
    const which = Math.floor(rand() * 3)
    latency = round(which === 0 ? between(80, 149) : between(20, 70))
    jitter = round(which === 1 ? between(30, 49) : between(6, 22))
    loss = round(which === 2 ? between(1, 2.9) : between(0, 0.7), 1)
    score = round(between(3.0, 3.59), 1)
  } else {
    // critical: ~20% are an unreachable/down platform (score —)
    if (rand() < 0.2) {
      downPlatform = pick(platforms)
      latency = round(between(40, 90)); jitter = round(between(8, 25)); loss = round(between(0, 0.5), 1)
      score = null
    } else {
      const which = Math.floor(rand() * 3)
      latency = round(which === 0 ? between(150, 280) : between(40, 120))
      jitter = round(which === 1 ? between(50, 90) : between(10, 35))
      loss = round(which === 2 ? between(3, 9) : between(0.2, 2), 1)
      score = round(between(2.4, 2.99), 1)
    }
  }

  const first = pick(firstNames)
  const last = pick(lastNames)
  return {
    id: `${locId}-${n}`,
    user: `${first} ${last}`,
    machine: `DESKTOP-${prefix[locId]}-${String(n).padStart(4, "0")}`,
    locationId: locId,
    locationName: locName,
    site,
    status,
    score,
    connection,
    latency,
    jitter,
    packetLoss: loss,
    isp: pick(isps[locId]),
    ip: `10.${Math.floor(between(10, 90))}.${Math.floor(between(1, 250))}.${Math.floor(between(1, 250))}`,
    team: pick(teams),
    primaryPlatform: downPlatform ?? pick(platforms),
    primaryIssue: deriveIssue(status, connection, latency, jitter, loss, downPlatform),
  }
}

function generate(): Endpoint[] {
  const out: Endpoint[] = []
  for (const loc of locations) {
    let n = 421
    const add = (status: Status, count: number) => {
      for (let i = 0; i < count; i++) out.push(makeEndpoint(loc.id, loc.name, status, n++))
    }
    add("critical", loc.critical)
    add("warning", loc.warning)
    add("healthy", loc.healthy)
  }
  return out
}

export const endpoints: Endpoint[] = generate()

// ---- selectors -------------------------------------------------------------

export type SortKey = "status" | "user" | "location" | "score" | "issue"
export type SortDir = "asc" | "desc"

const severity: Record<Status, number> = { critical: 0, warning: 1, healthy: 2 }

export interface EndpointQuery {
  search?: string
  locationId?: string // "all" or a location id
  status?: Status | "all"
  sortKey?: SortKey
  sortDir?: SortDir
}

export function queryEndpoints(q: EndpointQuery): Endpoint[] {
  const search = (q.search ?? "").trim().toLowerCase()
  let rows = endpoints.filter((e) => {
    if (q.locationId && q.locationId !== "all" && e.locationId !== q.locationId) return false
    if (q.status && q.status !== "all" && e.status !== q.status) return false
    if (search && !(`${e.user} ${e.machine}`.toLowerCase().includes(search))) return false
    return true
  })

  const key = q.sortKey ?? "status"
  const dir = q.sortDir ?? "asc"
  const mul = dir === "asc" ? 1 : -1
  rows = [...rows].sort((a, b) => {
    switch (key) {
      case "user": return mul * a.user.localeCompare(b.user)
      case "location": return mul * a.locationName.localeCompare(b.locationName)
      case "score": return mul * ((a.score ?? -1) - (b.score ?? -1))
      case "issue": return mul * (a.primaryIssue ?? "").localeCompare(b.primaryIssue ?? "")
      case "status":
      default: {
        // worst-first: severity, then lowest score
        const s = severity[a.status] - severity[b.status]
        if (s !== 0) return mul * s
        return mul * ((a.score ?? 99) - (b.score ?? 99))
      }
    }
  })
  return rows
}

// ---- Active alerts (derived from unhealthy endpoints) ----------------------

export interface ActiveAlert {
  id: string
  endpoint: Endpoint
  severity: Exclude<Status, "healthy">
  reason: string
  minutesAgo: number
}

const sev: Record<Status, number> = { critical: 0, warning: 1, healthy: 2 }

export function activeAlertsForLocation(locId: string): ActiveAlert[] {
  const loc = locations.find((l) => l.id === locId)
  if (!loc) return []
  const picked = endpoints
    .filter((e) => e.locationId === locId && e.status !== "healthy")
    .sort((a, b) => sev[a.status] - sev[b.status] || (a.score ?? 9) - (b.score ?? 9))
    .slice(0, loc.activeAlerts)
  return picked.map((e, i) => ({
    id: `al-${e.id}`,
    endpoint: e,
    severity: e.status as Exclude<Status, "healthy">,
    reason: e.primaryIssue ?? "Degraded",
    minutesAgo: 3 + i * 9,
  }))
}

export function activeAlertsAll(): ActiveAlert[] {
  return locations
    .flatMap((l) => activeAlertsForLocation(l.id))
    .sort((a, b) => sev[a.severity] - sev[b.severity] || a.minutesAgo - b.minutesAgo)
}

// ---- Alert rollups (group affected endpoints by cause) ---------------------

export type RollupCause = "platform" | "loss" | "latency" | "jitter" | "other"

export interface Rollup {
  id: string
  locationId: string
  locationName: string
  severity: Exclude<Status, "healthy">
  title: string
  cause: RollupCause
  affected: number
  endpoints: Endpoint[]
  startedMinAgo: number
}

function categorize(e: Endpoint): { cause: RollupCause; key: string; title: string } {
  const reason = (e.primaryIssue ?? "").toLowerCase()
  if (reason.endsWith("down")) return { cause: "platform", key: `platform:${e.primaryPlatform}`, title: `${e.primaryPlatform} unreachable` }
  if (reason.startsWith("packet loss")) return { cause: "loss", key: "loss", title: "Elevated packet loss" }
  if (reason.includes("jitter")) return { cause: "jitter", key: "jitter", title: "Network jitter" }
  if (reason.startsWith("latency")) return { cause: "latency", key: "latency", title: "High latency" }
  return { cause: "other", key: "other", title: "Degraded performance" }
}

// Isolated, endpoint-specific issues that don't pertain to other endpoints.
const singleReasons = ["High CPU utilisation", "Memory pressure", "Headset disconnected", "Agent app crash"]

export function rollupsForLocation(locId: string): Rollup[] {
  const loc = locations.find((l) => l.id === locId)
  if (!loc || loc.activeAlerts === 0) return []
  const slots = loc.activeAlerts
  const unhealthy = endpoints
    .filter((e) => e.locationId === locId && e.status !== "healthy")
    .sort((a, b) => sev[a.status] - sev[b.status] || (a.score ?? 9) - (b.score ?? 9))

  // group by cause
  const groups = new Map<string, { title: string; cause: RollupCause; eps: Endpoint[] }>()
  for (const e of unhealthy) {
    const { cause, key, title } = categorize(e)
    if (!groups.has(key)) groups.set(key, { title, cause, eps: [] })
    groups.get(key)!.eps.push(e)
  }
  const groupArr = [...groups.entries()].sort((a, b) => b[1].eps.length - a[1].eps.length)

  // mix: most slots are multi-endpoint rollups, the last 1–2 are isolated single-endpoint alerts
  const singlesWanted = slots >= 4 ? 2 : slots >= 2 ? 1 : 0
  const rollupWanted = Math.max(1, slots - singlesWanted)

  const multi: Rollup[] = groupArr.slice(0, rollupWanted).map(([key, g], i) => {
    const severity: Exclude<Status, "healthy"> = g.eps.some((e) => e.status === "critical") ? "critical" : "warning"
    return {
      id: `ru-${locId}-${key}`,
      locationId: locId,
      locationName: loc.name,
      severity,
      title: g.title,
      cause: g.cause,
      affected: g.eps.length,
      endpoints: g.eps,
      startedMinAgo: 8 + i * 13,
    }
  })

  const used = new Set(multi.flatMap((r) => r.endpoints.map((e) => e.id)))
  const singlesPool = unhealthy.filter((e) => !used.has(e.id))
  const singles: Rollup[] = singlesPool.slice(0, singlesWanted).map((e, i) => ({
    id: `ru1-${e.id}`,
    locationId: locId,
    locationName: loc.name,
    severity: e.status as Exclude<Status, "healthy">,
    title: singleReasons[(i + locId.length) % singleReasons.length],
    cause: "other" as RollupCause,
    affected: 1,
    endpoints: [e],
    startedMinAgo: 4 + i * 6,
  }))

  const result = [...multi, ...singles]
  result.sort((a, b) => sev[a.severity] - sev[b.severity] || b.affected - a.affected)
  return result.slice(0, slots)
}

export function rollupsAll(): Rollup[] {
  return locations
    .flatMap((l) => rollupsForLocation(l.id))
    .sort((a, b) => sev[a.severity] - sev[b.severity] || b.affected - a.affected)
}
