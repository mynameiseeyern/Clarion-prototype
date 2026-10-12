import {
  LayoutDashboard,
  Monitor,
  SlidersHorizontal,
  BookOpen,
  Workflow,
  Laptop,
  Component,
  ListChecks,
  Users,
  FolderTree,
  RadioTower,
  CreditCard,
  ScrollText,
  ShieldCheck,
  Network,
  ReceiptText,
  KeyRound,
  type LucideIcon,
} from "lucide-react"

export type PageId =
  | "overview" | "endpoints" | "alerts" | "thresholds"
  | "users" | "groups" | "widgets" | "sso" | "subscription" | "audit"
  | "rbacdoc" | "groupsdoc" | "billingdoc"
  | "glossary" | "issuesdoc" | "devicesdoc" | "scopedoc" | "components"

export interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "endpoints", label: "Endpoints", icon: Monitor },
  { id: "thresholds", label: "Thresholds", icon: SlidersHorizontal },
]

// De-scoped from the sidebar for MVP (kept as a Day-2 route reachable via the
// Overview card / command palette). Labels that aren't rendered in any nav list
// but are still needed by pageLabel() / breadcrumbs live here.
const offNavLabels: Partial<Record<PageId, string>> = {
  alerts: "Alerts",
}

// Administration — shown only to Admins (role-gated within the one Fleet view).
// "Members" is the scaffolded screen; the rest are placeholders mapping to the
// Admin epics (see ADMIN-TICKETS.md).
export const adminNavItems: NavItem[] = [
  { id: "widgets", label: "Device management", icon: RadioTower },
  { id: "users", label: "Members", icon: Users },
  { id: "groups", label: "Groups", icon: FolderTree },
  { id: "sso", label: "Single sign-on", icon: KeyRound },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "audit", label: "Audit log", icon: ScrollText },
]

// Internal Administration docs (shown in the Admin sidebar's "Product
// development" group). Scoped to admin concepts — RBAC, Groups, billing.
export const adminDocNavItems: NavItem[] = [
  { id: "rbacdoc", label: "Roles & permissions", icon: ShieldCheck },
  { id: "groupsdoc", label: "Groups & hierarchy", icon: Network },
  { id: "billingdoc", label: "Subscription & billing", icon: ReceiptText },
]

// Internal — not shipped in the built product.
export const devNavItems: NavItem[] = [
  { id: "scopedoc", label: "Scope", icon: ListChecks },
  { id: "components", label: "Components", icon: Component },
  { id: "glossary", label: "Glossary", icon: BookOpen },
  { id: "devicesdoc", label: "Endpoints model", icon: Laptop },
  { id: "issuesdoc", label: "Alerts model", icon: Workflow },
]

export const pageLabel = (id: PageId) =>
  [...navItems, ...adminNavItems, ...adminDocNavItems, ...devNavItems].find((n) => n.id === id)?.label
    ?? offNavLabels[id]
    ?? "Overview"

// Optional one-line context under a page title (shown in the top chrome).
// Add entries only where a subtitle is genuinely useful — keep pages lean otherwise.
export const pageSubtitle: Partial<Record<PageId, string>> = {
  thresholds: "Set when an endpoint is flagged warning or critical.",
  users: "Invite people, set their role, and manage access.",
  groups: "Organise Widgets into Groups that scope what each Manager sees.",
  widgets: "Register, assign and revoke endpoint Widgets. A Widget becomes an Endpoint once it's set up and reporting.",
  sso: "Let Members sign in with your company's identity provider.",
  subscription: "Review your plan, usage and billing.",
  audit: "Track who changed what, and when.",
  rbacdoc: "How roles, scope and permissions work.",
  groupsdoc: "How the Group tree scopes visibility.",
  billingdoc: "Plan entitlements, usage and payment model.",
}

// ---- URL routing (shareable per-page links) --------------------------------

export const pagePath: Record<PageId, string> = {
  overview: "/",
  endpoints: "/endpoints",
  alerts: "/issues",
  thresholds: "/thresholds",
  users: "/admin/users",
  groups: "/admin/groups",
  widgets: "/admin/widgets",
  sso: "/admin/sso",
  subscription: "/admin/subscription",
  audit: "/admin/audit",
  rbacdoc: "/admin/docs/roles",
  groupsdoc: "/admin/docs/groups",
  billingdoc: "/admin/docs/billing",
  glossary: "/glossary",
  devicesdoc: "/devices-model",
  issuesdoc: "/issues-model",
  scopedoc: "/scope",
  components: "/components",
}

export const pageFromPath = (path: string): PageId => {
  const clean = path.replace(/\/+$/, "") || "/"
  return (Object.keys(pagePath) as PageId[]).find((id) => pagePath[id] === clean) ?? "overview"
}

// ---- Drawer deep-linking (query param on the current page) ------------------
// A drilldown is a modal layered over a page, so it lives as a query param on
// that page rather than its own route:  /devices?device=ep_1842 · /issues?issue=al_07
export interface DrawerParams { device?: string; issue?: string }

export const readDrawerParams = (search: string): DrawerParams => {
  const p = new URLSearchParams(search)
  return { device: p.get("device") ?? undefined, issue: p.get("issue") ?? undefined }
}

export const buildPath = (page: PageId, drawer: DrawerParams = {}): string => {
  const p = new URLSearchParams()
  if (drawer.device) p.set("device", drawer.device)
  if (drawer.issue) p.set("issue", drawer.issue)
  const qs = p.toString()
  return qs ? `${pagePath[page]}?${qs}` : pagePath[page]
}

// ---- Experiences (two surfaces in one repo) --------------------------------
// "fleet" = the supervisor dashboard · "admin" = the Administration surface.
// The Administration experience has its own shell (sidebar + chrome); it's
// reached from the top-right account menu. The top-left sidebar switches org.

export type Experience = "fleet" | "admin"

export const adminPageIds: PageId[] = ["users", "groups", "widgets", "sso", "subscription", "audit", "rbacdoc", "groupsdoc", "billingdoc"]

export const experienceOf = (id: PageId): Experience =>
  (adminPageIds as string[]).includes(id) ? "admin" : "fleet"

export const defaultPageFor: Record<Experience, PageId> = { fleet: "overview", admin: "users" }

export const experienceLabel: Record<Experience, string> = {
  fleet: "Fleet dashboard",
  admin: "Administration",
}
