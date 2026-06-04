import { ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusDot, LegendItem } from "./primitives"
import { locations, mapMarkers, fleet, type Status } from "@/data/dashboard"

const statusVar: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
}

function MapPanel() {
  return (
    <div
      className="flex w-full flex-col lg:w-[654px] lg:shrink-0"
      style={{ borderRight: "1px solid var(--border-neutral-subtle)" }}
    >
      {/* header */}
      <div className="flex items-start justify-between p-4">
        <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          Endpoints in{" "}
          <span style={{ color: "var(--fg-link-default)" }}>{fleet.selectedLocation}</span>
        </h2>
        <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs">
          View endpoints
          <ArrowRight className="size-3" />
        </Button>
      </div>

      {/* map */}
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <div
          className="relative h-[272px] w-full overflow-hidden rounded-md"
          style={{ background: "var(--bg-canvas)" }}
        >
          {/* stylised continents */}
          <svg
            viewBox="0 0 654 272"
            className="absolute inset-0 size-full"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden
          >
            <g fill="var(--bg-neutral-subtle-pressed)" opacity="0.7">
              <path d="M70 120 Q120 70 200 90 Q230 130 180 170 Q120 190 80 160 Z" />
              <path d="M300 70 Q380 50 430 90 Q470 130 410 150 Q340 160 310 120 Z" />
              <path d="M420 150 Q470 150 460 200 Q430 240 400 210 Q400 175 420 150 Z" />
              <path d="M200 175 Q250 175 240 215 Q210 245 185 220 Q185 190 200 175 Z" />
              <path d="M520 180 Q580 175 590 215 Q560 245 520 225 Q505 200 520 180 Z" />
            </g>
          </svg>

          {/* markers */}
          {mapMarkers.map((m) => (
            <div
              key={m.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
            >
              {m.active ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className="flex size-4 items-center justify-center rounded-full"
                    style={{ border: "2px solid var(--status-healthy)", background: "var(--bg-card)" }}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ background: statusVar[m.status] }}
                    />
                  </span>
                  <span
                    className="whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium"
                    style={{
                      background: "var(--bg-neutral-emphasis)",
                      color: "var(--fg-on-neutral-emphasis)",
                      boxShadow: "var(--shadow-md)",
                    }}
                  >
                    {m.label} · {m.count}
                  </span>
                </div>
              ) : (
                <span
                  className="block size-3 rounded-full"
                  style={{
                    background: statusVar[m.status],
                    border: "1px solid var(--bg-card)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* legend */}
        <div className="flex items-center gap-2 px-0">
          <LegendItem status="healthy" label="Healthy" />
          <LegendItem status="warning" label="Warning" />
          <LegendItem status="critical" label="Critical" />
        </div>
      </div>
    </div>
  )
}

function LocationsPanel() {
  return (
    <div className="flex min-w-px flex-1 flex-col">
      <div
        className="flex items-baseline gap-1 p-4"
        style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}
      >
        <span className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          Locations
        </span>
        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          · {locations.length - 1} Total
        </span>
      </div>
      <div className="flex flex-col">
        {locations.map((loc) => (
          <button
            key={loc.id}
            type="button"
            className="relative flex items-center justify-between gap-2 p-4 text-left transition-colors"
            style={{
              borderBottom: "1px solid var(--border-neutral-subtle)",
              background: loc.selected
                ? "var(--bg-neutral-subtle-hovered)"
                : "var(--bg-card)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = loc.selected
                ? "var(--bg-neutral-subtle-hovered)"
                : "var(--bg-card)")
            }
          >
            {loc.selected && (
              <span
                className="absolute left-0 top-0 h-full w-0.5"
                style={{ background: "var(--border-focused)" }}
              />
            )}
            <span className="flex items-center gap-2">
              {loc.status && <StatusDot status={loc.status} />}
              <span
                className="text-sm"
                style={{ color: "var(--fg-neutral-emphasis)" }}
              >
                {loc.name}
              </span>
            </span>
            <span
              className="flex items-center gap-1 font-mono text-xs"
              style={{
                color: loc.selected
                  ? "var(--fg-neutral-emphasis)"
                  : "var(--fg-neutral-muted)",
              }}
            >
              <span>{loc.endpoints.toLocaleString()} endpoints</span>
              <span>·</span>
              <span>{loc.issues === 0 ? "No issues" : `${loc.issues} issues`}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function MapAndLocations() {
  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex flex-col lg:flex-row">
        <MapPanel />
        <LocationsPanel />
      </div>
    </Card>
  )
}
