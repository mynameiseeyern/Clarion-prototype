import { useMemo, useState } from "react"
import { ArrowRight, ChevronRight, CircleCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusFilter, statusVar, statusBadge, cap, initials, type StatusOption } from "@/components/endpoints/status"
import { queryEndpoints, type Endpoint, type EndpointStatus } from "@/data/endpoints"

// The Overview attention card only ever deals with unhealthy endpoints.
const ATTENTION_STATUSES: EndpointStatus[] = ["critical", "warning"]
// Default view = critical endpoints only (warning is opt-in via the filter).
const DEFAULT_STATUSES: EndpointStatus[] = ["critical"]
const ATTENTION_OPTIONS: StatusOption[] = [
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warning" },
]

/**
 * "Endpoints needing attention" — a fleet-wide list of unhealthy endpoints,
 * critical first. Independent of the map selection. A status filter (Critical /
 * Warning only) lets the user flick between severities; rows open the endpoint
 * drilldown; "View all endpoints" jumps to the Endpoints tab.
 */
export function EndpointsAttentionCard({
  onViewEndpoints,
  onOpenEndpoint,
}: {
  onViewEndpoints: (loc?: string | string[]) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
}) {
  const [statuses, setStatuses] = useState<EndpointStatus[]>(DEFAULT_STATUSES)
  const toggleStatus = (s: EndpointStatus) =>
    setStatuses((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]))

  // empty selection falls back to the full attention set (never healthy/offline)
  const rows = useMemo(() => {
    const effective = statuses.length ? statuses : ATTENTION_STATUSES
    return queryEndpoints({ statuses: effective, sortKey: "status", sortDir: "asc" })
  }, [statuses])

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0 }
    for (const r of rows) if (r.status === "critical") c.critical++
    else if (r.status === "warning") c.warning++
    return c
  }, [rows])

  const subtitle = ATTENTION_OPTIONS.filter((o) => counts[o.id as "critical" | "warning"] > 0)
    .map((o) => `${counts[o.id as "critical" | "warning"].toLocaleString()} ${o.label.toLowerCase()}`)
    .join(" · ")

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex items-center justify-between gap-2 p-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Endpoints needing attention</h2>
          {rows.length > 0 && (
            <Badge variant={counts.critical > 0 ? "danger" : "warning"}>{rows.length.toLocaleString()}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusFilter
            value={statuses}
            onToggle={toggleStatus}
            onClear={() => setStatuses([])}
            options={ATTENTION_OPTIONS}
            allLabel="All"
          />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onViewEndpoints("all")}>
            View all endpoints
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {rows.length > 0 ? (
        <>
          <div className="px-4 pt-3 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{subtitle}</div>
          <div className="flex max-h-80 flex-col overflow-y-auto overscroll-contain p-2">
            {rows.map((e, i) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onOpenEndpoint(rows, i)}
                className="group flex items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors"
                onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
                onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
              >
                {/* identity */}
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-medium"
                  style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)" }}>
                  {initials(e.user)}
                </span>
                <div className="flex w-44 shrink-0 flex-col">
                  <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</span>
                  <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{e.machine}</span>
                </div>
                {/* status */}
                <span className="w-24 shrink-0"><Badge variant={statusBadge[e.status]}>{cap(e.status)}</Badge></span>
                {/* location */}
                <span className="hidden w-36 shrink-0 truncate text-sm md:block" style={{ color: "var(--fg-neutral-muted)" }}>{e.locationName}</span>
                {/* event */}
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
                  {e.event ? (
                    <>
                      <span className="size-1.5 shrink-0 rounded-full" style={{ background: statusVar[e.status] }} />
                      <span className="truncate">{e.event}</span>
                      {e.eventCount > 1 && <span className="shrink-0 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>+{e.eventCount - 1}</span>}
                    </>
                  ) : (
                    <span style={{ color: "var(--fg-neutral-subtle)" }}>—</span>
                  )}
                </span>
                {/* clarity network score */}
                <span className="w-10 shrink-0 text-right font-mono text-sm font-medium"
                  style={{ color: e.status === "critical" ? "var(--fg-danger-emphasis)" : e.status === "warning" ? "var(--fg-warning-emphasis)" : "var(--fg-neutral-emphasis)" }}>
                  {e.score ?? "—"}
                </span>
                <ChevronRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-subtle)" }} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-0.5 px-4 py-6">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
            <CircleCheck className="size-4" style={{ color: "var(--fg-success-emphasis)" }} />
            No endpoints need attention
          </p>
          <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>All endpoints are healthy right now.</p>
        </div>
      )}
    </Card>
  )
}
