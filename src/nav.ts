import {
  LayoutDashboard,
  Monitor,
  TriangleAlert,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react"

export type PageId = "overview" | "endpoints" | "alerts" | "thresholds"

export interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "endpoints", label: "Endpoints", icon: Monitor },
  { id: "alerts", label: "Alerts", icon: TriangleAlert },
  { id: "thresholds", label: "Thresholds", icon: SlidersHorizontal },
]

export const pageLabel = (id: PageId) =>
  navItems.find((n) => n.id === id)?.label ?? "Overview"
