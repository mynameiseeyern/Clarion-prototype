import { ArrowRight, CircleCheck, Timer, Bot, ChevronRight, Siren, Wifi, Activity, Gauge, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { KpiCard } from "./KpiCard"
import { LegendItem } from "./primitives"
import { locations, locationById, recentActivityFor, type RecentActivity, type Status } from "@/data/dashboard"
import { rollupsForLocation, rollupsAll, type RollupCause, type Rollup } from "@/data/endpoints"

const iconMap: Record<string, LucideIcon> = { resolved: CircleCheck, time: Timer, auto: Bot }
const causeIcon: Record<RollupCause, LucideIcon> = {
  platform: Siren, loss: Activity, latency: Gauge, jitter: Wifi, other: Activity,
}
const sevTone: Record<Exclude<Status, "healthy">, { bg: string; fg: string; dot: string }> = {
  critical: { bg: "var(--bg-danger-subtle)", fg: "var(--fg-on-danger-subtle)", dot: "var(--status-critical)" },
  warning: { bg: "var(--bg-warning-subtle)", fg: "var(--fg-on-warning-subtle)", dot: "var(--status-warning)" },
}

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
  onOpenAlert,
}: {
  selectedId: string
  onViewAll: () => void
  onOpenAlert: (rollups: Rollup[], index: number) => void
}) {
  const isAll = selectedId === "all"
  const loc = locationById(selectedId)
  const name = isAll ? "all locations" : loc?.name ?? "—"
  const rollups = isAll ? rollupsAll() : rollupsForLocation(selectedId)
  const totalAffected = rollups.reduce((s, r) => s + r.affected, 0)

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Open issues</h2>
          {rollups.length > 0 && (
            <span className="flex h-5 items-center rounded-full px-2 text-xs font-medium" style={{ background: "var(--bg-danger-subtle)", color: "var(--fg-on-danger-subtle)" }}>
              {rollups.length}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onViewAll}>
          View all issues
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {rollups.length > 0 ? (
        <>
          <div className="px-4 pt-3 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
            {rollups.length} issue{rollups.length === 1 ? "" : "s"} · {totalAffected.toLocaleString()} endpoints affected in {name}
          </div>
          <div className="flex flex-col p-2">
            {rollups.map((r, i) => {
              const Icon = causeIcon[r.cause]
              const tone = sevTone[r.severity]
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onOpenAlert(rollups, i)}
                  className="group flex items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ background: tone.bg, color: tone.fg }}>
                    <Icon className="size-4" />
                  </span>
                  <div className="flex min-w-px flex-1 flex-col">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{r.title}</span>
                      <span className="shrink-0 rounded-full px-1.5 text-xs font-medium" style={{ background: tone.bg, color: tone.fg }}>
                        {r.affected} endpoint{r.affected === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="truncate text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
                      {isAll ? r.locationName + " · " : ""}started {r.startedMinAgo}m ago
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center -space-x-2">
                    {r.endpoints.slice(0, 3).map((e) => (
                      <span key={e.id} className="flex size-6 items-center justify-center rounded-full text-[10px] font-medium"
                        style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", border: "1.5px solid var(--bg-card)" }}>
                        {e.user.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </span>
                    ))}
                    {r.affected > 3 && (
                      <span className="flex h-6 items-center justify-center rounded-full px-1.5 text-[10px] font-medium"
                        style={{ background: "var(--bg-neutral-subtle-pressed)", color: "var(--fg-neutral-muted)", border: "1.5px solid var(--bg-card)" }}>
                        +{r.affected - 3}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-subtle)" }} />
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-0.5 px-4 py-4">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
            <CircleCheck className="size-4" style={{ color: "var(--fg-success)" }} />
            No open issues in {name}
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
