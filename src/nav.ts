import {
  LayoutDashboard,
  Monitor,
  TriangleAlert,
  SlidersHorizontal,
  BookOpen,
  Workflow,
  Laptop,
  Component,
  type LucideIcon,
} from "lucide-react"

export type PageId = "overview" | "endpoints" | "alerts" | "thresholds" | "glossary" | "issuesdoc" | "devicesdoc" | "components"

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

// Internal — not shipped in the built product.
export const devNavItems: NavItem[] = [
  { id: "components", label: "Components", icon: Component },
  { id: "glossary", label: "Glossary", icon: BookOpen },
  { id: "devicesdoc", label: "Devices model", icon: Laptop },
  { id: "issuesdoc", label: "Issues model", icon: Workflow },
]

export const pageLabel = (id: PageId) =>
  [...navItems, ...devNavItems].find((n) => n.id === id)?.label ?? "Overview"

// Optional one-line context under a page title (shown in the top chrome).
// Add entries only where a subtitle is genuinely useful — keep pages lean otherwise.
export const pageSubtitle: Partial<Record<PageId, string>> = {
  thresholds: "Set when a device is flagged warning or critical.",
}

// ---- URL routing (shareable per-page links) --------------------------------

export const pagePath: Record<PageId, string> = {
  overview: "/",
  endpoints: "/users",
  alerts: "/issues",
  thresholds: "/thresholds",
  glossary: "/glossary",
  devicesdoc: "/devices-model",
  issuesdoc: "/issues-model",
  components: "/components",
}

export const pageFromPath = (path: string): PageId => {
  const clean = path.replace(/\/+$/, "") || "/"
  return (Object.keys(pagePath) as PageId[]).find((id) => pagePath[id] === clean) ?? "overview"
}
