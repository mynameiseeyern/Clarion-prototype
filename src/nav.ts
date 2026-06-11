import {
  LayoutDashboard,
  Monitor,
  TriangleAlert,
  SlidersHorizontal,
  BookOpen,
  Workflow,
  Laptop,
  type LucideIcon,
} from "lucide-react"

export type PageId = "overview" | "endpoints" | "alerts" | "thresholds" | "glossary" | "issuesdoc" | "devicesdoc"

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
  { id: "glossary", label: "Glossary", icon: BookOpen },
  { id: "devicesdoc", label: "Devices model", icon: Laptop },
  { id: "issuesdoc", label: "Issues model", icon: Workflow },
]

export const pageLabel = (id: PageId) =>
  [...navItems, ...devNavItems].find((n) => n.id === id)?.label ?? "Overview"

// ---- URL routing (shareable per-page links) --------------------------------

export const pagePath: Record<PageId, string> = {
  overview: "/",
  endpoints: "/users",
  alerts: "/issues",
  thresholds: "/thresholds",
  glossary: "/glossary",
  devicesdoc: "/devices-model",
  issuesdoc: "/issues-model",
}

export const pageFromPath = (path: string): PageId => {
  const clean = path.replace(/\/+$/, "") || "/"
  return (Object.keys(pagePath) as PageId[]).find((id) => pagePath[id] === clean) ?? "overview"
}
