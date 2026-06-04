import { ArrowRight, CircleCheck, Timer, Bot, ChevronRight, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { KpiCard } from "./KpiCard"
import { LegendItem } from "./primitives"
import { locations, locationById, recentActivityFor, type RecentActivity, type Status } from "@/data/dashboard"
import { activeAlertsForLocation, activeAlertsAll, type Endpoint } from "@/data/endpoints"

const iconMap: Record<string, LucideIcon> = { resolved: CircleCheck, time: Timer, auto: Bot }
const statusVar: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
}
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

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
  onOpenEndpoint,
}: {
  selectedId: string
  onViewAll: () => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
}) {
  const isAll = selectedId === "all"
  const loc = locationById(selectedId)
  const name = isAll ? "all locations" : loc?.name ?? "—"
  const alerts = isAll ? activeAlertsAll() : activeAlertsForLocation(selectedId)
  const alertEndpoints = alerts.map((a) => a.endpoint)

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Active alerts</h2>
          {alerts.length > 0 && (
            <span
              className="flex h-5 items-center rounded-full px-2 text-xs font-medium"
              style={{ background: "var(--bg-danger-subtle)", color: "var(--fg-on-danger-subtle)" }}
            >
              {alerts.length}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onViewAll}>
          View all alerts
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {alerts.length > 0 ? (
        /* --- active state: list of alerts --- */
        <div className="flex flex-col">
          {alerts.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onOpenEndpoint(alertEndpoints, i)}
              className="group flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span className="size-2 shrink-0 rounded-full" style={{ background: statusVar[a.severity] }} />
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)" }}
              >
                {initials(a.endpoint.user)}
              </span>
              <div className="flex min-w-px flex-1 flex-col">
                <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
                  {a.reason}
                </span>
                <span className="truncate text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
                  {a.endpoint.user} · <span className="font-mono">{a.endpoint.machine}</span>
                  {isAll ? ` · ${a.endpoint.locationName}` : ""}
                </span>
              </div>
              <span className="shrink-0 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{a.minutesAgo}m ago</span>
              <ChevronRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-subtle)" }} />
            </button>
          ))}
        </div>
      ) : (
        /* --- clear state: 24h recovery snapshot --- */
        <div className="flex flex-col gap-0.5 px-4 py-4">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
            <CircleCheck className="size-4" style={{ color: "var(--fg-success)" }} />
            No active alerts in {name}
          </p>
          <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
            Recent activity for this location · last 24 h
          </p>
          <div className="flex flex-wrap items-center gap-2 py-2">
            {(() => {
              const recent = isAll ? aggregateRecent() : recentActivityFor(selectedId)
              const items = [
                { id: "resolved", label: "Resolved", value: String(recent.resolved), icon: "resolved" as const },
                { id: "avg", label: "Average time", value: recent.avgTime, icon: "time" as const },
                { id: "auto", label: "Auto-fixed", value: String(recent.autoFixed), icon: "auto" as const },
              ]
              return items.map((a) => (
                <KpiCard key={a.id} title={a.label} icon={iconMap[a.icon]} value={a.value} fixedWidth>
                  <div className="flex items-center gap-2">
                    <LegendItem label="Healthy" muted showDot={false} />
                    <LegendItem label="Warning" muted showDot={false} />
                    <LegendItem label="Critical" muted showDot={false} />
                  </div>
                </KpiCard>
              ))
            })()}
          </div>
        </div>
      )}
    </Card>
  )
}
