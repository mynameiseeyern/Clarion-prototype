import { ArrowRight, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusDot, LegendItem } from "./primitives"
import { locations, mapMarkers, locationById, type Status } from "@/data/dashboard"

const statusVar: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
}

function MapPanel({
  selectedId,
  onSelect,
  onViewEndpoints,
}: {
  selectedId: string
  onSelect: (id: string) => void
  onViewEndpoints: () => void
}) {
  const selected = locationById(selectedId)
  return (
    <div
      className="flex w-full flex-col lg:w-[654px] lg:shrink-0"
      style={{ borderRight: "1px solid var(--border-neutral-subtle)" }}
    >
      <div className="flex items-center justify-between p-4">
        <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          Endpoints in{" "}
          <span style={{ color: "var(--fg-link-default)" }}>{selected?.name ?? "—"}</span>
        </h2>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onViewEndpoints}>
          View endpoints
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <div className="relative h-[272px] w-full overflow-hidden rounded-md" style={{ background: "var(--bg-canvas)" }}>
          <svg viewBox="0 0 654 272" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <g fill="var(--bg-neutral-subtle-pressed)" opacity="0.7">
              <path d="M70 120 Q120 70 200 90 Q230 130 180 170 Q120 190 80 160 Z" />
              <path d="M300 70 Q380 50 430 90 Q470 130 410 150 Q340 160 310 120 Z" />
              <path d="M420 150 Q470 150 460 200 Q430 240 400 210 Q400 175 420 150 Z" />
              <path d="M200 175 Q250 175 240 215 Q210 245 185 220 Q185 190 200 175 Z" />
              <path d="M520 180 Q580 175 590 215 Q560 245 520 225 Q505 200 520 180 Z" />
            </g>
          </svg>

          {mapMarkers.map((m) => {
            const loc = locationById(m.id)
            const isActive = m.id === selectedId
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m.id)}
                aria-label={loc?.name}
                className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
              >
                {isActive ? (
                  <span className="flex flex-col items-center gap-1.5">
                    <span
                      className="flex size-4 items-center justify-center rounded-full"
                      style={{ border: `2px solid ${statusVar[m.status]}`, background: "var(--bg-card)" }}
                    >
                      <span className="size-2 rounded-full" style={{ background: statusVar[m.status] }} />
                    </span>
                    <span
                      className="whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium"
                      style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", boxShadow: "var(--shadow-md)" }}
                    >
                      {loc?.name} · {loc?.endpoints}
                    </span>
                  </span>
                ) : (
                  <span
                    className="block size-3 rounded-full transition-transform hover:scale-125"
                    style={{ background: statusVar[m.status], border: "1px solid var(--bg-card)", boxShadow: "var(--shadow-xs)" }}
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <LegendItem status="healthy" label="Healthy" />
          <LegendItem status="warning" label="Warning" />
          <LegendItem status="critical" label="Critical" />
        </div>
      </div>
    </div>
  )
}

function LocationsPanel({
  selectedId,
  onSelect,
}: {
  selectedId: string
  onSelect: (id: string) => void
}) {
  const totalEndpoints = locations.reduce((s, l) => s + l.endpoints, 0)
  const totalIssues = locations.reduce((s, l) => s + l.issues, 0)

  const rows = [
    { id: "all", name: "All locations", status: undefined as Status | undefined, endpoints: totalEndpoints, issues: totalIssues },
    ...locations,
  ]

  return (
    <div className="flex min-w-px flex-1 flex-col">
      <div className="flex items-baseline gap-1 p-4" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
        <span className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Locations</span>
        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>· {locations.length} Total</span>
      </div>
      <div className="flex flex-col">
        {rows.map((loc) => {
          const isSelected = loc.id === selectedId
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSelect(loc.id)}
              className="relative flex items-center justify-between gap-2 p-4 text-left transition-colors"
              style={{
                borderBottom: "1px solid var(--border-neutral-subtle)",
                background: isSelected ? "var(--bg-neutral-subtle-hovered)" : "var(--bg-card)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = isSelected ? "var(--bg-neutral-subtle-hovered)" : "var(--bg-card)")
              }
            >
              {isSelected && (
                <span className="absolute left-0 top-0 h-full w-0.5" style={{ background: "var(--border-focused)" }} />
              )}
              <span className="flex items-center gap-2">
                {loc.status && <StatusDot status={loc.status} />}
                <span className="text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>{loc.name}</span>
              </span>
              <span
                className="flex items-center gap-1 font-mono text-xs"
                style={{ color: isSelected ? "var(--fg-neutral-emphasis)" : "var(--fg-neutral-muted)" }}
              >
                <span>{loc.endpoints.toLocaleString()} endpoints</span>
                <span>·</span>
                <span>{loc.issues === 0 ? "No issues" : `${loc.issues} issues`}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MapAndLocations({
  selectedId,
  onSelect,
  onViewEndpoints,
}: {
  selectedId: string
  onSelect: (id: string) => void
  onViewEndpoints: () => void
}) {
  // map markers don't include "all"; fall back to a sensible marker target
  const mapSelected = selectedId === "all" ? "sydney" : selectedId
  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex flex-col lg:flex-row">
        <MapPanel selectedId={mapSelected} onSelect={onSelect} onViewEndpoints={onViewEndpoints} />
        <LocationsPanel selectedId={selectedId} onSelect={onSelect} />
      </div>
    </Card>
  )
}
