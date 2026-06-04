import { useState } from "react"
import { ArrowRight, ChevronRight, ArrowLeft } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusDot, LegendItem } from "./primitives"
import {
  locationById, citiesInCountry, countryById, countriesWithStats,
  type Status, type LocationRow,
} from "@/data/dashboard"

const statusVar: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
}

/* ---------------- Map ---------------- */
function MapPanel({
  country, setCountry, selectedId, onSelect, onViewEndpoints,
}: {
  country: string | null
  setCountry: (id: string | null) => void
  selectedId: string
  onSelect: (id: string) => void
  onViewEndpoints: (locId?: string) => void
}) {
  const cs = countriesWithStats()
  const ctry = country ? countryById(country) : null
  const cities = country ? citiesInCountry(country) : []

  return (
    <div className="flex w-full flex-col lg:w-[654px] lg:shrink-0" style={{ borderRight: "1px solid var(--border-neutral-subtle)" }}>
      <div className="flex items-center justify-between p-4">
        <h2 className="flex items-center gap-1.5 text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          {ctry ? (
            <>
              <button type="button" onClick={() => setCountry(null)} className="rounded p-0.5 transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }} aria-label="Back to world">
                <ArrowLeft className="size-4" />
              </button>
              Endpoints in <span style={{ color: "var(--fg-link-default)" }}>{ctry.name}</span>
            </>
          ) : (
            <>Endpoints <span style={{ color: "var(--fg-neutral-muted)" }}>· worldwide</span></>
          )}
        </h2>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onViewEndpoints(country ? undefined : "all")}>
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

          {/* world view: country clusters */}
          {!country && cs.map((c) => (
            <button key={c.id} type="button" onClick={() => setCountry(c.id)} aria-label={c.name}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 focus:outline-none"
              style={{ left: `${c.x}%`, top: `${c.y}%` }}>
              <span className="flex items-center gap-1.5 rounded-full px-2 py-1 shadow-md transition-transform hover:scale-105"
                style={{ background: "var(--bg-card)", border: `2px solid ${statusVar[c.status]}` }}>
                <span className="size-2 rounded-full" style={{ background: statusVar[c.status] }} />
                <span className="font-mono text-xs font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{c.endpoints.toLocaleString()}</span>
              </span>
              <span className="rounded px-1 text-[10px] font-medium" style={{ color: "var(--fg-neutral-muted)" }}>{c.name}</span>
            </button>
          ))}

          {/* country view: city markers */}
          {country && cities.map((m) => {
            const isActive = m.id === selectedId
            return (
              <button key={m.id} type="button" onClick={() => onSelect(m.id)} aria-label={m.name}
                className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
                {isActive ? (
                  <span className="flex flex-col items-center gap-1.5">
                    <span className="flex size-4 items-center justify-center rounded-full" style={{ border: `2px solid ${statusVar[m.status ?? "healthy"]}`, background: "var(--bg-card)" }}>
                      <span className="size-2 rounded-full" style={{ background: statusVar[m.status ?? "healthy"] }} />
                    </span>
                    <span className="whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium" style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", boxShadow: "var(--shadow-md)" }}>
                      {m.name} · {m.endpoints}
                    </span>
                  </span>
                ) : (
                  <span className="block size-3 rounded-full transition-transform hover:scale-125" style={{ background: statusVar[m.status ?? "healthy"], border: "1px solid var(--bg-card)", boxShadow: "var(--shadow-xs)" }} />
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <LegendItem status="healthy" label="Healthy" />
          <LegendItem status="warning" label="Warning" />
          <LegendItem status="critical" label="Critical" />
          {!country && <span className="ml-auto text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>Select a region to drill in</span>}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Locations / regions panel ---------------- */
function LocationsPanel({
  country, setCountry, selectedId, onSelect, onViewEndpoints, onAllLocations,
}: {
  country: string | null
  setCountry: (id: string | null) => void
  selectedId: string
  onSelect: (id: string) => void
  onViewEndpoints: (locId?: string) => void
  onAllLocations: () => void
}) {
  const cs = countriesWithStats()
  const cities = country ? citiesInCountry(country) : []
  const ctry = country ? countryById(country) : null

  return (
    <div className="flex min-w-px flex-1 flex-col">
      {/* header */}
      {ctry ? (
        <button type="button" onClick={onAllLocations}
          className="flex items-center gap-2 p-4 text-left transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
          style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
          <ArrowLeft className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>All locations</span>
          <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>· {ctry.name} · {cities.length} cities</span>
        </button>
      ) : (
        <div className="flex items-baseline gap-1 p-4" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
          <span className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Locations</span>
          <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>· {cs.length} regions</span>
        </div>
      )}

      {/* scrollable list */}
      <div className="flex max-h-[312px] flex-col overflow-y-auto">
        {!country
          ? cs.map((c) => (
              <button key={c.id} type="button" onClick={() => setCountry(c.id)}
                className="group relative flex items-center justify-between gap-2 p-4 text-left transition-colors"
                style={{ borderBottom: "1px solid var(--border-neutral-subtle)", background: "var(--bg-card)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-card)")}>
                <span className="flex min-w-px items-center gap-2">
                  <StatusDot status={c.status} />
                  <span className="truncate text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>{c.name}</span>
                  <span className="shrink-0 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{c.cityCount} cities</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
                  <span>{c.endpoints.toLocaleString()} endpoints</span>
                  <ChevronRight className="size-4 opacity-40 transition-opacity group-hover:opacity-100" />
                </span>
              </button>
            ))
          : cities.map((loc) => {
              const isSelected = loc.id === selectedId
              return (
                <div key={loc.id} className="group relative flex items-stretch transition-colors"
                  style={{ borderBottom: "1px solid var(--border-neutral-subtle)", background: isSelected ? "var(--bg-neutral-subtle-hovered)" : "var(--bg-card)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? "var(--bg-neutral-subtle-hovered)" : "var(--bg-card)")}>
                  {isSelected && <span className="absolute left-0 top-0 h-full w-0.5" style={{ background: "var(--border-focused)" }} />}
                  <button type="button" onClick={() => onSelect(loc.id)} className="flex min-w-px flex-1 items-center justify-between gap-2 py-4 pl-4 pr-2 text-left">
                    <span className="flex min-w-px items-center gap-2">
                      {loc.status && <StatusDot status={loc.status} />}
                      <span className="truncate text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>{loc.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 whitespace-nowrap font-mono text-xs" style={{ color: isSelected ? "var(--fg-neutral-emphasis)" : "var(--fg-neutral-muted)" }}>
                      <span>{loc.endpoints.toLocaleString()} endpoints</span>
                      <span>·</span>
                      <span>{loc.issues === 0 ? "No issues" : `${loc.issues} issues`}</span>
                    </span>
                  </button>
                  <button type="button" aria-label={`View ${loc.name} endpoints`} onClick={() => onViewEndpoints(loc.id)}
                    className="flex w-10 shrink-0 items-center justify-center transition-colors hover:bg-[var(--bg-neutral-subtle-pressed)]">
                    <ChevronRight className="size-4 opacity-40 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-muted)" }} />
                  </button>
                </div>
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
  onViewEndpoints: (locId?: string) => void
}) {
  // derive the initial drilled country from a selected city, else world view
  const initialCountry = (() => {
    const loc: LocationRow | undefined = selectedId === "all" ? undefined : locationById(selectedId)
    return loc?.countryId ?? null
  })()
  const [country, setCountry] = useState<string | null>(initialCountry)

  const handleSelectCity = (id: string) => {
    const loc = locationById(id)
    if (loc) setCountry(loc.countryId)
    onSelect(id)
  }
  const handleAllLocations = () => {
    setCountry(null)
    onSelect("all")
  }

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex flex-col lg:flex-row">
        <MapPanel country={country} setCountry={setCountry} selectedId={selectedId} onSelect={handleSelectCity} onViewEndpoints={onViewEndpoints} />
        <LocationsPanel country={country} setCountry={setCountry} selectedId={selectedId} onSelect={handleSelectCity} onViewEndpoints={onViewEndpoints} onAllLocations={handleAllLocations} />
      </div>
    </Card>
  )
}
