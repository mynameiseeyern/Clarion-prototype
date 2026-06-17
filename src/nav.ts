import {
  LayoutDashboard,
  Monitor,
  TriangleAlert,
  SlidersHorizontal,
  BookOpen,
  Workflow,
  Laptop,
  Component,
  Users,
  FolderTree,
  RadioTower,
  CreditCard,
  ScrollText,
  type LucideIcon,
} from "lucide-react"

export type PageId =
  | "overview" | "endpoints" | "alerts" | "thresholds"
  | "users" | "groups" | "widgets" | "subscription" | "audit"
  | "glossary" | "issuesdoc" | "devicesdoc" | "components"

export interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "endpoints", label: "Devices", icon: Monitor },
  { id: "alerts", label: "Issues", icon: TriangleAlert },
  { id: "thresholds", label: "Thresholds", icon: SlidersHorizontal },
]

// Administration — shown only to Admins (role-gated within the one Fleet view).
// "Members" is the scaffolded screen; the rest are placeholders mapping to the
// Admin epics (see ADMIN-TICKETS.md).
export const adminNavItems: NavItem[] = [
  { id: "widgets", label: "Device management", icon: RadioTower },
  { id: "users", label: "Members", icon: Users },
  { id: "groups", label: "Groups", icon: FolderTree },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "audit", label: "Audit log", icon: ScrollText },
]

// Internal — not shipped in the built product.
export const devNavItems: NavItem[] = [
  { id: "components", label: "Components", icon: Component },
  { id: "glossary", label: "Glossary", icon: BookOpen },
  { id: "devicesdoc", label: "Devices model", icon: Laptop },
  { id: "issuesdoc", label: "Issues model", icon: Workflow },
]

export const pageLabel = (id: PageId) =>
  [...navItems, ...adminNavItems, ...devNavItems].find((n) => n.id === id)?.label ?? "Overview"

// Optional one-line context under a page title (shown in the top chrome).
// Add entries only where a subtitle is genuinely useful — keep pages lean otherwise.
export const pageSubtitle: Partial<Record<PageId, string>> = {
  thresholds: "Set when a device is flagged warning or critical.",
  users: "Invite people, set their role, and manage access.",
  groups: "Organise Widgets into Groups that scope what each Manager sees.",
  widgets: "Register, assign and revoke endpoint Widgets. A Widget becomes a Device once it's set up and reporting.",
  subscription: "Review your plan, usage and billing.",
  audit: "Track who changed what, and when.",
}

// ---- URL routing (shareable per-page links) --------------------------------

export const pagePath: Record<PageId, string> = {
  overview: "/",
  endpoints: "/devices",
  alerts: "/issues",
  thresholds: "/thresholds",
  users: "/admin/users",
  groups: "/admin/groups",
  widgets: "/admin/widgets",
  subscription: "/admin/subscription",
  audit: "/admin/audit",
  glossary: "/glossary",
  devicesdoc: "/devices-model",
  issuesdoc: "/issues-model",
  components: "/components",
}

export const pageFromPath = (path: string): PageId => {
  const clean = path.replace(/\/+$/, "") || "/"
  return (Object.keys(pagePath) as PageId[]).find((id) => pagePath[id] === clean) ?? "overview"
}

// ---- Experiences (two surfaces in one repo) --------------------------------
// "fleet" = the supervisor dashboard · "admin" = the Administration surface.
// The Administration experience has its own shell (sidebar + chrome); it's
// reached from the top-right account menu. The top-left sidebar switches org.

export type Experience = "fleet" | "admin"

export const adminPageIds: PageId[] = ["users", "groups", "widgets", "subscription", "audit"]

export const experienceOf = (id: PageId): Experience =>
  (adminPageIds as string[]).includes(id) ? "admin" : "fleet"

export const defaultPageFor: Record<Experience, PageId> = { fleet: "overview", admin: "users" }

export const experienceLabel: Record<Experience, string> = {
  fleet: "Fleet dashboard",
  admin: "Administration",
}
