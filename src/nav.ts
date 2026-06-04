import {
  LayoutDashboard,
  Monitor,
  TriangleAlert,
  SlidersHorizontal,
  BookOpen,
  type LucideIcon,
} from "lucide-react"

export type PageId = "overview" | "endpoints" | "alerts" | "thresholds" | "glossary"

export interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "endpoints", label: "Endpoints", icon: Monitor },
  { id: "alerts", label: "Issues", icon: TriangleAlert },
  { id: "thresholds", label: "Thresholds", icon: SlidersHorizontal },
]

// Internal — not shipped in the built product.
export const devNavItems: NavItem[] = [
  { id: "glossary", label: "Glossary", icon: BookOpen },
]

export const pageLabel = (id: PageId) =>
  [...navItems, ...devNavItems].find((n) => n.id === id)?.label ?? "Overview"
