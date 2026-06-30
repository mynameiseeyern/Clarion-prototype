import { useMemo, useState } from "react"
import { ArrowRight, ChevronRight, CircleCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

  // Full attention universe (independent of the active filter) so the total and
  // the severity breakdown are always shown upfront, even when filtered.
  const attention = useMemo(() => {
    const all = queryEndpoints({ statuses: ATTENTION_STATUSES })
    let critical = 0, warning = 0
    for (const e of all) { if (e.status === "critical") critical++; else if (e.status === "warning") warning++ }
    return { critical, warning, total: all.length }
  }, [])
  const subtitle = `${attention.critical.toLocaleString()} critical · ${attention.warning.toLocaleString()} warning`

  return (
    <Card className="flex min-h-0 w-full flex-1 flex-col gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex items-center justify-between gap-2 p-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Endpoints needing attention</h2>
          {attention.total > 0 && (
            <Badge variant={attention.critical > 0 ? "danger" : "warning"}>{attention.total.toLocaleString()}</Badge>
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
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr style={{ color: "var(--fg-neutral-muted)" }}>
                  {["Endpoint", "Status", "Location", "Clarity Network Score", "Event"].map((h) => (
                    <th key={h} className="h-10 px-4 text-left text-xs font-medium"
                      style={{ background: "var(--bg-neutral-subtle)", borderBottom: "1px solid var(--border-neutral-muted)" }}>{h}</th>
                  ))}
                  <th className="w-10" style={{ background: "var(--bg-neutral-subtle)", borderBottom: "1px solid var(--border-neutral-muted)" }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((e, i) => (
                  <tr
                    key={e.id}
                    onClick={() => onOpenEndpoint(rows, i)}
                    className="group cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
                    onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8"><AvatarFallback>{initials(e.user)}</AvatarFallback></Avatar>
                        <div className="flex min-w-px flex-col">
                          <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</span>
                          <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{e.machine}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge[e.status]} className="gap-1.5">
                        <span className="size-1.5 rounded-full" style={{ background: statusVar[e.status] }} />
                        {cap(e.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3"><span className="whitespace-nowrap text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{e.locationName} · {e.site}</span></td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium"
                        style={{ color: e.score === null ? "var(--fg-neutral-subtle)" : e.status === "critical" ? "var(--fg-danger-emphasis)" : e.status === "warning" ? "var(--fg-warning-emphasis)" : "var(--fg-neutral-emphasis)" }}>
                        {e.score === null ? "—" : e.score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {e.event ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
                          <span className="size-1.5 shrink-0 rounded-full" style={{ background: statusVar[e.status] }} />
                          {e.event}
                          {e.eventCount > 1 && e.eventAgo !== null && (
                            <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>· {e.eventAgo}m ago · +{e.eventCount - 1}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-sm" style={{ color: "var(--fg-neutral-subtle)" }}>—</span>
                      )}
                    </td>
                    <td className="pr-3">
                      <ChevronRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-subtle)" }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
