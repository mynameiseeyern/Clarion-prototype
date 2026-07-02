import { useMemo, useState } from "react"
import { ArrowRight, ChevronRight, CircleCheck, MapPin, Globe, Phone } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusFilter, statusVar, type StatusOption } from "@/components/endpoints/status"
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

  const hasCritical = rows.some((r) => r.status === "critical")

  return (
    <Card className="flex min-h-0 w-full flex-1 flex-col gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex items-center justify-between gap-2 p-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Endpoints needing attention</h2>
          {rows.length > 0 && (
            <Badge variant={hasCritical ? "danger" : "warning"}>{rows.length.toLocaleString()}</Badge>
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
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {rows.map((e, i) => {
            const alertColor = e.status === "critical" ? "var(--fg-danger-emphasis)" : "var(--fg-warning-emphasis)"
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onOpenEndpoint(rows, i)}
                className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
                style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}
                onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
                onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
              >
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: statusVar[e.status] }} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="text-sm">
                    <span className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</span>
                    <span style={{ color: "var(--fg-neutral-subtle)" }}> · {e.machine}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3 shrink-0" /> {e.locationName} · {e.site}</span>
                    <span className="inline-flex items-center gap-1"><Globe className="size-3 shrink-0" /> {e.isp} · {e.ip}</span>
                    <span className="inline-flex items-center gap-1"><Phone className="size-3 shrink-0" /> {e.primaryPlatform}</span>
                  </div>
                  {e.event && (
                    <div className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: alertColor }}>
                      <span className="size-1.5 shrink-0 rounded-full" style={{ background: statusVar[e.status] }} />
                      {e.event}
                      {e.eventCount > 1 && <span className="font-normal" style={{ color: "var(--fg-neutral-subtle)" }}> · +{e.eventCount - 1} more</span>}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-sm font-medium" style={{ color: e.score === null ? "var(--fg-neutral-subtle)" : alertColor }}>
                    {e.score ?? "—"}
                  </span>
                  <ChevronRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-subtle)" }} />
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 px-4 py-10 text-center">
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
