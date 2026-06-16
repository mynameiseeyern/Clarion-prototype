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

// Minimal Group catalogue so the Group column / picker has something to show.
// The full Group hierarchy lives in Epic B (not scaffolded yet).
export const groups: { id: string; name: string }[] = [
  { id: "ldn-t1", name: "London · Tier 1" },
  { id: "ldn-t2", name: "London · Tier 2" },
  { id: "nyc", name: "New York" },
  { id: "syd", name: "Sydney" },
  { id: "mnl", name: "Manila" },
]

export const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? id

export const users: AccountUser[] = [
  { id: "u1", name: "Ava Thornton", email: "ava.thornton@ir.com", role: "admin", status: "active", groups: [], lastActive: "2m ago" },
  { id: "u2", name: "Marcus Reyes", email: "marcus.reyes@ir.com", role: "admin", status: "active", groups: [], lastActive: "1h ago" },
  { id: "u3", name: "Priya Nair", email: "priya.nair@ir.com", role: "manager", status: "active", groups: ["ldn-t1", "ldn-t2"], lastActive: "12m ago" },
  { id: "u4", name: "Daniel Okafor", email: "daniel.okafor@ir.com", role: "manager", status: "active", groups: ["nyc"], lastActive: "3h ago" },
  { id: "u5", name: "Sofia Bianchi", email: "sofia.bianchi@ir.com", role: "manager", status: "active", groups: ["syd"], lastActive: "yesterday" },
  { id: "u6", name: "Liam Chen", email: "liam.chen@ir.com", role: "manager", status: "invited", groups: ["mnl"], lastActive: null, invitedAgo: "2d ago" },
  { id: "u7", name: "Hannah Schmidt", email: "hannah.schmidt@ir.com", role: "manager", status: "invited", groups: ["ldn-t2"], lastActive: null, invitedAgo: "5h ago" },
  { id: "u8", name: "Tomás Herrera", email: "tomas.herrera@ir.com", role: "manager", status: "deactivated", groups: ["nyc"], lastActive: "3w ago" },
  { id: "u9", name: "Grace Mwangi", email: "grace.mwangi@ir.com", role: "manager", status: "active", groups: ["mnl", "syd"], lastActive: "40m ago" },
  { id: "u10", name: "Noah Patel", email: "noah.patel@ir.com", role: "manager", status: "active", groups: ["ldn-t1"], lastActive: "5m ago" },
]
