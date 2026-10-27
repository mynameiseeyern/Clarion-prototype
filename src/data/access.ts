// Iris platform access (Client Admin) — RBAC, Groups and Locations. Dummy data + a
// small store for the prototype.
//
// Follows "Iris Platform: Role-Based Access Control (RBAC), Groups and Locations"
// (Ben Webb, draft, Oct 2026):
// - IR owns a fixed catalogue of roles. Tenant roles cover the whole tenant; product
//   roles cover one Iris product and can be limited to one or more locations.
// - Groups are flat (no nesting) so they line up with IdP groups later (SSO / SCIM).
// - Locations are flat, named by the customer, and shared by every Iris product.
//   In Clarion a widget user (and so their endpoints) belongs to at most one location.
// - Users get roles through groups. A role given straight to a user is an exception.
// - Access is everything all your roles allow. No deny rules.
//
// The Clarion "CC Manager" from the PO page isn't a role here: it's a group (for
// example "Sydney CC managers") holding Clarion Viewer, limited to Sydney.
// See RBAC-PROPOSAL.md.

import { clearLocation, store as widgetStore } from "@/data/widgetUsers"

// ------------------------------------------------------------------ catalogue --

export type RoleId = "tenant_admin" | "user_admin" | "auditor" | "product_admin" | "editor" | "viewer"
export type ProductId = "clarion"

export const products: { id: ProductId; name: string }[] = [{ id: "clarion", name: "Clarion" }]
export const productName = (id?: ProductId) => products.find((p) => p.id === id)?.name ?? ""

export interface RoleDef {
  id: RoleId
  name: string
  level: "tenant" | "product"
  summary: string
  /** What it means in Clarion. Each product team agrees its own mapping. */
  clarion: string
  /** Proposed, still to agree with the Clarion team. */
  open?: string
}

export const roles: RoleDef[] = [
  { id: "tenant_admin", name: "Tenant Admin", level: "tenant",
    summary: "Full access, including sign-in settings (SSO, SCIM, break-glass), users, groups, locations, roles and every product.",
    clarion: "Everything in Clarion, every location." },
  { id: "user_admin", name: "User Admin", level: "tenant",
    summary: "Manages users and groups, and gives roles up to their own level. No sign-in settings or locations.",
    clarion: "No Clarion data unless also given a Clarion role." },
  { id: "auditor", name: "Auditor", level: "tenant",
    summary: "Read-only view of settings, users, groups, locations, role assignments and the audit log.",
    clarion: "No Clarion data unless also given a Clarion role." },
  { id: "product_admin", name: "Product Admin", level: "product",
    summary: "Configures the product and manages its settings. Limited to locations, it applies to resources in those locations only.",
    clarion: "Overview, Endpoints, Thresholds and widget users. Manages widget users in their locations." },
  { id: "editor", name: "Editor", level: "product",
    summary: "Creates and edits content in the product, or in the given locations.",
    clarion: "Same as Viewer today.",
    open: "Clarion has little to edit yet. Candidates: acknowledging alerts, notes on endpoints." },
  { id: "viewer", name: "Viewer", level: "product",
    summary: "Read-only access in the product, or in the given locations.",
    clarion: "Overview and Endpoints, read-only. No Thresholds, no Administration. This is the PO's \"CC Manager\"." },
]
export const roleDef = (id: RoleId) => roles.find((r) => r.id === id)!
const productRank: Record<RoleId, number> = { tenant_admin: 4, product_admin: 3, editor: 2, viewer: 1, user_admin: 0, auditor: 0 }

// ---------------------------------------------------------------------- model --

export interface Assignment {
  id: string
  role: RoleId
  /** Set for product roles. */
  product?: ProductId
  /** Location ids. Empty = every location (product-wide). Tenant roles are always empty. */
  locations: string[]
}

export interface Group {
  id: string
  name: string
  description: string
  /** Local = managed in Iris. Linked = managed by the IdP (arrives with SSO / SCIM), read-only here. */
  source: "local" | "linked"
  idpGroup?: string
  /** Built-in (like Retool's Admin group): can't be deleted, renamed or lose Tenant Admin. */
  locked?: boolean
  members: string[]
  assignments: Assignment[]
}

export interface Location { id: string; name: string; description: string }

export type PersonStatus = "active" | "invited" | "deactivated"

export interface Person {
  id: string
  name: string
  email: string
  status: PersonStatus
  lastActive: string | null
  invitedAgo?: string
  /** Break-glass accounts are always Tenant Admin (RBAC can't change it). */
  breakGlass?: boolean
  /** Roles given straight to the person — exceptions, flagged in the UI. */
  direct: Assignment[]
}

export const statusLabel: Record<PersonStatus, string> = { active: "Active", invited: "Invited", deactivated: "Deactivated" }

// ----------------------------------------------------------------------- seed --

const L = { syd: "loc-syd", mel: "loc-mel", akl: "loc-akl", mnl: "loc-mnl", ldn: "loc-ldn", chi: "loc-chi" }

const seedLocations: Location[] = [
  { id: L.syd, name: "Sydney", description: "Chatswood and Parramatta sites" },
  { id: L.mel, name: "Melbourne", description: "" },
  { id: L.akl, name: "Auckland", description: "" },
  { id: L.mnl, name: "Manila", description: "Ortigas outsourcer" },
  { id: L.ldn, name: "London", description: "" },
  { id: L.chi, name: "Chicago", description: "" },
]

let n = 0
const a = (role: RoleId, locations: string[] = [], product?: ProductId): Assignment =>
  ({ id: `as-${++n}`, role, product: roleDef(role).level === "product" ? (product ?? "clarion") : undefined, locations })

const seedPeople: Person[] = [
  { id: "p1", name: "Ava Thornton", email: "ava.thornton@acme.com", status: "active", lastActive: "2m ago", breakGlass: true, direct: [a("tenant_admin")] },
  { id: "p2", name: "Marcus Reyes", email: "marcus.reyes@acme.com", status: "active", lastActive: "1h ago", direct: [] },
  { id: "p12", name: "Kofi Mensah", email: "kofi.mensah@acme.com", status: "active", lastActive: "today", direct: [] },
  { id: "p9", name: "Hannah Schmidt", email: "hannah.schmidt@acme.com", status: "active", lastActive: "2d ago", direct: [] },
  { id: "p8", name: "Grace Mwangi", email: "grace.mwangi@acme.com", status: "active", lastActive: "40m ago", direct: [] },
  { id: "p5", name: "Daniel Okafor", email: "daniel.okafor@acme.com", status: "active", lastActive: "3h ago", direct: [] },
  { id: "p3", name: "Priya Nair", email: "priya.nair@acme.com", status: "active", lastActive: "12m ago", direct: [] },
  { id: "p4", name: "Noah Patel", email: "noah.patel@acme.com", status: "active", lastActive: "5m ago", direct: [] },
  { id: "p6", name: "Sofia Bianchi", email: "sofia.bianchi@acme.com", status: "active", lastActive: "yesterday", direct: [] },
  { id: "p7", name: "Liam Chen", email: "liam.chen@acme.com", status: "invited", lastActive: null, invitedAgo: "2d ago", direct: [] },
  { id: "p10", name: "Elena Rossi", email: "elena.rossi@acme.com", status: "active", lastActive: "4d ago", direct: [a("viewer", [L.ldn])] },
  { id: "p13", name: "Sam Okoro", email: "sam.okoro@acme.com", status: "invited", lastActive: null, invitedAgo: "1h ago", direct: [] },
  { id: "p11", name: "Tomás Herrera", email: "tomas.herrera@acme.com", status: "deactivated", lastActive: "3w ago", direct: [] },
]

const seedGroups: Group[] = [
  { id: "g-it", name: "IT administrators", description: "Runs the Iris tenant", source: "local", locked: true, members: ["p2"], assignments: [a("tenant_admin")] },
  { id: "g-desk", name: "Service desk", description: "Onboards and offboards people", source: "local", members: ["p12"], assignments: [a("user_admin")] },
  { id: "g-sec", name: "Security and compliance", description: "Quarterly access reviews", source: "local", members: ["p9"], assignments: [a("auditor")] },
  { id: "g-clarion-admin", name: "Clarion administrators", description: "Sets thresholds and manages widget users", source: "local", members: ["p2", "p12"], assignments: [a("product_admin")] },
  { id: "g-lead", name: "Contact centre leadership", description: "Sees every site", source: "local", members: ["p8"], assignments: [a("viewer")] },
  { id: "g-apac", name: "APAC operations leads", description: "", source: "local", members: ["p5"], assignments: [a("viewer", [L.syd, L.mel, L.akl])] },
  { id: "g-syd", name: "Sydney CC managers", description: "", source: "local", members: ["p3", "p4"], assignments: [a("viewer", [L.syd])] },
  { id: "g-mnl", name: "Manila CC managers", description: "Outsourcer team leads", source: "local", members: ["p6", "p7"], assignments: [a("viewer", [L.mnl])] },
  { id: "g-ldn", name: "London CC managers", description: "", source: "local", members: ["p11"], assignments: [a("viewer", [L.ldn])] },
]

// ---------------------------------------------------------------------- store --

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
let state = { people: clone(seedPeople), groups: clone(seedGroups), locations: clone(seedLocations), version: 0 }
const listeners = new Set<() => void>()
const bump = () => { state = { ...state, version: state.version + 1 }; listeners.forEach((l) => l()) }
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`

/** The admin using the prototype: Marcus, a Tenant Admin through "IT administrators". */
export const ME = "p2"

export const access = {
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  version: () => state.version,
  people: () => state.people,
  groups: () => state.groups,
  locations: () => state.locations,
  person: (id: string) => state.people.find((p) => p.id === id),
  group: (id: string) => state.groups.find((g) => g.id === id),
  location: (id: string) => state.locations.find((l) => l.id === id),
  reset() { state = { people: clone(seedPeople), groups: clone(seedGroups), locations: clone(seedLocations), version: state.version + 1 }; listeners.forEach((l) => l()) },

  // people
  invite(p: { email: string; name: string; groups: string[] }) {
    const id = uid("p")
    state.people = [{ id, name: p.name, email: p.email, status: "invited", lastActive: null, invitedAgo: "just now", direct: [] }, ...state.people]
    state.groups = state.groups.map((g) => (p.groups.includes(g.id) && g.source === "local" ? { ...g, members: [...g.members, id] } : g))
    bump()
    return id
  },
  setStatus(id: string, status: PersonStatus) { state.people = state.people.map((p) => (p.id === id ? { ...p, status } : p)); bump() },
  addDirect(personId: string, x: Omit<Assignment, "id">) {
    state.people = state.people.map((p) => (p.id === personId ? { ...p, direct: [...p.direct, { ...x, id: uid("as") }] } : p)); bump()
  },
  removeDirect(personId: string, assignmentId: string) {
    state.people = state.people.map((p) => (p.id === personId ? { ...p, direct: p.direct.filter((x) => x.id !== assignmentId) } : p)); bump()
  },

  // groups
  createGroup(g: { name: string; description: string }) {
    const id = uid("g")
    state.groups = [...state.groups, { id, name: g.name.trim(), description: g.description.trim(), source: "local", members: [], assignments: [] }]
    bump()
    return id
  },
  updateGroup(id: string, patch: Partial<Pick<Group, "name" | "description">>) { state.groups = state.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)); bump() },
  deleteGroup(id: string) { state.groups = state.groups.filter((g) => g.id !== id || g.locked); bump() },
  addMembers(groupId: string, ids: string[]) {
    state.groups = state.groups.map((g) => (g.id === groupId ? { ...g, members: [...new Set([...g.members, ...ids])] } : g)); bump()
  },
  removeMember(groupId: string, personId: string) {
    state.groups = state.groups.map((g) => (g.id === groupId ? { ...g, members: g.members.filter((m) => m !== personId) } : g)); bump()
  },
  addGroupRole(groupId: string, x: Omit<Assignment, "id">) {
    state.groups = state.groups.map((g) => (g.id === groupId ? { ...g, assignments: [...g.assignments, { ...x, id: uid("as") }] } : g)); bump()
  },
  removeGroupRole(groupId: string, assignmentId: string) {
    state.groups = state.groups.map((g) => (g.id === groupId ? { ...g, assignments: g.assignments.filter((x) => x.id !== assignmentId) } : g)); bump()
  },

  // locations
  createLocation(l: { name: string; description: string }) {
    const id = uid("loc")
    state.locations = [...state.locations, { id, name: l.name.trim(), description: l.description.trim() }]
    bump()
    return id
  },
  updateLocation(id: string, patch: Partial<Pick<Location, "name" | "description">>) { state.locations = state.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)); bump() },
  /** Its widget users become unassigned; role assignments limited to it lose it, and go if it was their only location. */
  deleteLocation(id: string) {
    const strip = (xs: Assignment[]) => xs.flatMap((x) => {
      if (!x.locations.includes(id)) return [x]
      const rest = x.locations.filter((l) => l !== id)
      return rest.length ? [{ ...x, locations: rest }] : []
    })
    state.locations = state.locations.filter((l) => l.id !== id)
    state.groups = state.groups.map((g) => ({ ...g, assignments: strip(g.assignments) }))
    state.people = state.people.map((p) => ({ ...p, direct: strip(p.direct) }))
    bump()
    clearLocation(id)
  },
}

// ---------------------------------------------------------------- derivations --

export const groupsOf = (personId: string) => state.groups.filter((g) => g.members.includes(personId))
export const locationName = (id: string | null | undefined) => (id ? state.locations.find((l) => l.id === id)?.name ?? "Unknown location" : "")

/** One line of a person's access, and where it comes from. */
export interface Grant { assignment: Assignment; via: { kind: "group"; group: Group } | { kind: "direct" } }

export function grantsOf(personId: string): Grant[] {
  const p = access.person(personId)
  if (!p) return []
  return [
    ...groupsOf(personId).flatMap((g) => g.assignments.map((x) => ({ assignment: x, via: { kind: "group" as const, group: g } }))),
    ...p.direct.map((x) => ({ assignment: x, via: { kind: "direct" as const } })),
  ]
}

export const isTenantAdmin = (personId: string) => grantsOf(personId).some((g) => g.assignment.role === "tenant_admin")

export interface ProductAccess {
  /** Highest product role held. Tenant Admin counts as Product Admin everywhere. */
  role: RoleId | null
  /** null = every location (including widget users with no location). */
  locations: string[] | null
}

/** What someone can do in Clarion, combining every role they hold. */
export function clarionAccess(personId: string): ProductAccess {
  const gs = grantsOf(personId).map((g) => g.assignment)
  if (gs.some((x) => x.role === "tenant_admin")) return { role: "tenant_admin", locations: null }
  const prod = gs.filter((x) => x.product === "clarion")
  if (!prod.length) return { role: null, locations: [] }
  const role = prod.reduce<RoleId>((best, x) => (productRank[x.role] > productRank[best] ? x.role : best), prod[0].role)
  const everywhere = prod.some((x) => x.locations.length === 0)
  return { role, locations: everywhere ? null : [...new Set(prod.flatMap((x) => x.locations))] }
}

/** How many Clarion widget users someone can see. */
export function clarionReach(personId: string) {
  const acc = clarionAccess(personId)
  const all = widgetStore.all()
  if (!acc.role) return 0
  if (acc.locations === null) return all.length
  const set = new Set(acc.locations)
  return all.filter((u) => u.locationId && set.has(u.locationId)).length
}

export const widgetUsersIn = (locationId: string) => widgetStore.all().filter((u) => u.locationId === locationId).length
export const unassignedWidgetUsers = () => widgetStore.all().filter((u) => !u.locationId).length

/** Groups and people with a role limited to this location. */
export function whoSees(locationId: string) {
  const groups = state.groups.filter((g) => g.assignments.some((x) => x.locations.includes(locationId)))
  const people = state.people.filter((p) => p.direct.some((x) => x.locations.includes(locationId)))
  return { groups, people }
}

/** "Clarion Viewer · Sydney, Melbourne" / "Tenant Admin" */
export function assignmentLabel(x: Assignment, opts: { withProduct?: boolean } = {}) {
  const r = roleDef(x.role).name
  if (roleDef(x.role).level === "tenant") return r
  const where = x.locations.length ? x.locations.map(locationName).join(", ") : "All locations"
  return `${opts.withProduct === false ? "" : productName(x.product) + " "}${r} · ${where}`
}

/** Members who are Tenant Admin. Safeguard: never fewer than one. */
export const tenantAdmins = () => state.people.filter((p) => p.status !== "deactivated" && isTenantAdmin(p.id))

/** Would removing this group role (or member) leave the tenant with no Tenant Admin? */
export function wouldOrphanTenant(change: { groupId?: string; assignmentId?: string; personId?: string; deleteGroup?: boolean }) {
  const before = tenantAdmins().map((p) => p.id)
  const remaining = before.filter((pid) => {
    const p = access.person(pid)!
    if (p.direct.some((x) => x.role === "tenant_admin" && x.id !== change.assignmentId)) return true
    return groupsOf(pid).some((g) => {
      if (change.groupId === g.id && change.deleteGroup) return false
      if (change.groupId === g.id && change.personId === pid) return false
      return g.assignments.some((x) => x.role === "tenant_admin" && x.id !== change.assignmentId)
    })
  })
  return remaining.length === 0
}

export const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

// ------------------------------------------------------------- give access --
// "What should they do?" + "Where?" → a role, then the group that already holds
// exactly that role (or a new one). People always land in a group, never a direct role.

export type Job = "view" | "manage" | "users" | "review"

export const jobs: { id: Job; label: string; hint: string; role: RoleId; scoped: boolean }[] = [
  { id: "view", label: "See the Clarion dashboard", hint: "Overview and Endpoints, read-only", role: "viewer", scoped: true },
  { id: "manage", label: "Manage Clarion", hint: "Also Thresholds and widget users", role: "product_admin", scoped: true },
  { id: "users", label: "Manage users and groups", hint: "No Clarion data", role: "user_admin", scoped: false },
  { id: "review", label: "Review access", hint: "Read-only settings and audit log", role: "auditor", scoped: false },
]
export const jobDef = (j: Job) => jobs.find((x) => x.id === j)!

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

/** A local group whose only role is exactly this one. */
export function matchingGroup(x: Omit<Assignment, "id">) {
  return state.groups.find((g) => g.source === "local" && g.assignments.length === 1 &&
    g.assignments[0].role === x.role && g.assignments[0].product === x.product && sameSet(g.assignments[0].locations, x.locations))
}

export function suggestGroupName(job: Job, locations: string[]) {
  const where = locations.map(locationName).join(", ")
  switch (job) {
    case "view": return locations.length ? `${where} CC managers` : "Clarion viewers (all locations)"
    case "manage": return locations.length ? `Clarion administrators – ${where}` : "Clarion administrators"
    case "users": return "User administrators"
    case "review": return "Auditors"
  }
}

/** Plain-language result of holding one role. */
export function describeRole(role: RoleId, locations: string[]) {
  const reach = role === "user_admin" || role === "auditor" ? 0
    : locations.length ? widgetStore.all().filter((u) => u.locationId && locations.includes(u.locationId)).length : widgetStore.all().length
  const where = locations.length ? locations.map(locationName).join(", ") : "all locations"
  switch (role) {
    case "viewer": case "editor":
      return { sees: `Overview and Endpoints for ${where} (${reach.toLocaleString()} widget users)`, not: "Thresholds or Administration" }
    case "product_admin":
      return { sees: `Overview, Endpoints, Thresholds and widget users for ${where} (${reach.toLocaleString()} widget users)`, not: "users, groups or sign-in settings" }
    case "user_admin":
      return { sees: "users and groups, and can give roles up to their own", not: "Clarion data, locations or sign-in settings" }
    case "auditor":
      return { sees: "settings, users, groups, roles and the audit log, read-only", not: "Clarion data" }
    case "tenant_admin":
      return { sees: "everything, including sign-in settings", not: "" }
  }
}
