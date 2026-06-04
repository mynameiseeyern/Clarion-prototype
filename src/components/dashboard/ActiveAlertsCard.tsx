import { ArrowRight, CircleCheck, Timer, Bot, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { KpiCard } from "./KpiCard"
import { LegendItem } from "./primitives"
import { locations, locationById, recentActivityFor, fleetTotals, type RecentActivity } from "@/data/dashboard"

const iconMap: Record<string, LucideIcon> = { resolved: CircleCheck, time: Timer, auto: Bot }

function aggregateRecent(): RecentActivity {
  const all = locations.map((l) => recentActivityFor(l.id))
  return {
    resolved: all.reduce((s, r) => s + r.resolved, 0),
    avgTime: "23m",
    autoFixed: all.reduce((s, r) => s + r.autoFixed, 0),
  }
}

export function ActiveAlertsCard({
  selectedId,
  onViewAll,
}: {
  selectedId: string
  onViewAll: () => void
}) {
  const isAll = selectedId === "all"
  const loc = locationById(selectedId)
  const name = isAll ? "all locations" : loc?.name ?? "—"
  const activeAlerts = isAll ? fleetTotals().activeAlerts : loc?.activeAlerts ?? 0
  const recent = isAll ? aggregateRecent() : recentActivityFor(selectedId)

  const items = [
    { id: "resolved", label: "Resolved", value: String(recent.resolved), icon: "resolved" as const },
    { id: "avg", label: "Average time", value: recent.avgTime, icon: "time" as const },
    { id: "auto", label: "Auto-fixed", value: String(recent.autoFixed), icon: "auto" as const },
  ]

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
        <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Active alerts</h2>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onViewAll}>
          View all alerts
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-0.5 px-4 py-4">
        <p className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          {activeAlerts === 0
            ? `No active alerts in ${name}`
            : `${activeAlerts} active alert${activeAlerts === 1 ? "" : "s"} in ${name}`}
        </p>
        <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          Recent activity for this location · last 24 h
        </p>

        <div className="flex flex-wrap items-center gap-2 py-2">
          {items.map((a) => (
            <KpiCard key={a.id} title={a.label} icon={iconMap[a.icon]} value={a.value} fixedWidth>
              <div className="flex items-center gap-2">
                <LegendItem label="Healthy" muted showDot={false} />
                <LegendItem label="Warning" muted showDot={false} />
                <LegendItem label="Critical" muted showDot={false} />
              </div>
            </KpiCard>
          ))}
        </div>
      </div>
    </Card>
  )
}
