// Admin · Users & Roles — dummy data for the prototype.
// NOTE: a "User" here is a login account (Admin / CC Manager), distinct from the
// `user` field on a Widget/Endpoint (the device owner). See ADMIN-TICKETS.md.

export type UserRole = "admin" | "manager"
export type UserStatus = "active" | "invited" | "deactivated"

export interface AccountUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  /** Group ids in scope — empty for Admins (they see everything). */
  groups: string[]
  /** Last sign-in, human label. null when never (still invited). */
  lastActive: string | null
  /** When the invite was sent (only meaningful while status === "invited"). */
  invitedAgo?: string
}

export const roleLabel: Record<UserRole, string> = {
  admin: "Admin",
  manager: "CC Manager",
}

export const roleBlurb: Record<UserRole, string> = {
  admin: "Full administrative control across the whole estate.",
  manager: "Operational access, scoped to assigned Groups.",
}

export const statusLabel: Record<UserStatus, string> = {
  active: "Active",
  invited: "Invited",
  deactivated: "Deactivated",
}

// Group hierarchy — mirrors a real org (Country → Area → Office → Shift).
// A Manager assigned to a node sees that node and everything beneath it (cascade).
export interface GroupNode { id: string; name: string; children?: GroupNode[] }

export const groupTree: GroupNode[] = [
  { id: "au", name: "Australia", children: [
    { id: "au-syd", name: "Sydney", children: [
      { id: "au-syd-chat", name: "Chatswood", children: [
        { id: "au-syd-chat-s1", name: "Shift 1" },
        { id: "au-syd-chat-s2", name: "Shift 2" },
      ] },
      { id: "au-syd-parr", name: "Parramatta", children: [
        { id: "au-syd-parr-s1", name: "Shift 1" },
        { id: "au-syd-parr-s2", name: "Shift 2" },
      ] },
    ] },
    { id: "au-mel", name: "Melbourne", children: [
      { id: "au-mel-cbd", name: "CBD" },
      { id: "au-mel-south", name: "Southbank" },
    ] },
  ] },
  { id: "uk", name: "United Kingdom", children: [
    { id: "uk-ldn", name: "London", children: [
      { id: "uk-ldn-t1", name: "Tier 1" },
      { id: "uk-ldn-t2", name: "Tier 2" },
    ] },
    { id: "uk-mcr", name: "Manchester" },
  ] },
  { id: "us", name: "United States", children: [
    { id: "us-nyc", name: "New York", children: [
      { id: "us-nyc-day", name: "Day shift" },
      { id: "us-nyc-night", name: "Night shift" },
    ] },
    { id: "us-aus", name: "Austin" },
  ] },
  { id: "ph", name: "Philippines", children: [
    { id: "ph-mnl", name: "Manila", children: [
      { id: "ph-mnl-a", name: "Team A" },
      { id: "ph-mnl-b", name: "Team B" },
    ] },
  ] },
]

// Flat index for name/path lookups.
const groupIndex = new Map<string, { name: string; parent?: string }>()
const indexGroups = (nodes: GroupNode[], parent?: string) => {
  for (const n of nodes) {
    groupIndex.set(n.id, { name: n.name, parent })
    if (n.children) indexGroups(n.children, n.id)
  }
}
indexGroups(groupTree)

/** Readable label for a group id, qualified by its parent (e.g. "London · Tier 1"). */
export const groupName = (id: string) => {
  const node = groupIndex.get(id)
  if (!node) return id
  const p = node.parent ? groupIndex.get(node.parent) : undefined
  return p ? `${p.name} · ${node.name}` : node.name
}

export const users: AccountUser[] = [
  { id: "u1", name: "Ava Thornton", email: "ava.thornton@ir.com", role: "admin", status: "active", groups: [], lastActive: "2m ago" },
  { id: "u2", name: "Marcus Reyes", email: "marcus.reyes@ir.com", role: "admin", status: "active", groups: [], lastActive: "1h ago" },
  { id: "u3", name: "Priya Nair", email: "priya.nair@ir.com", role: "manager", status: "active", groups: ["uk-ldn-t1", "uk-ldn-t2"], lastActive: "12m ago" },
  { id: "u4", name: "Daniel Okafor", email: "daniel.okafor@ir.com", role: "manager", status: "active", groups: ["us-nyc"], lastActive: "3h ago" },
  { id: "u5", name: "Sofia Bianchi", email: "sofia.bianchi@ir.com", role: "manager", status: "active", groups: ["au-syd"], lastActive: "yesterday" },
  { id: "u6", name: "Liam Chen", email: "liam.chen@ir.com", role: "manager", status: "invited", groups: ["ph-mnl"], lastActive: null, invitedAgo: "2d ago" },
  { id: "u7", name: "Hannah Schmidt", email: "hannah.schmidt@ir.com", role: "manager", status: "invited", groups: ["uk-ldn-t2"], lastActive: null, invitedAgo: "5h ago" },
  { id: "u8", name: "Tomás Herrera", email: "tomas.herrera@ir.com", role: "manager", status: "deactivated", groups: ["us-nyc"], lastActive: "3w ago" },
  { id: "u9", name: "Grace Mwangi", email: "grace.mwangi@ir.com", role: "manager", status: "active", groups: ["ph-mnl", "au-mel"], lastActive: "40m ago" },
  { id: "u10", name: "Noah Patel", email: "noah.patel@ir.com", role: "manager", status: "active", groups: ["uk-ldn-t1"], lastActive: "5m ago" },
]
