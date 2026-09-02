import { useMemo, useState, useEffect, useRef } from "react"
import { Search, X, Check, Minus, Monitor, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, CircleCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Chip } from "@/components/ui/chip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { countries, citiesInCountry } from "@/data/dashboard"
import { queryEndpoints, type Endpoint, type EndpointStatus, type SortKey, type SortDir } from "@/data/endpoints"
import { StatusFilter, statusVar, statusBadge, cap, initials } from "./status"
import { formatAgo } from "@/lib/utils"

// Locations grouped under their country (label only — cities are selectable), all alphabetical.
const countryGroups = [...countries]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({ name: c.name, cities: [...citiesInCountry(c.id)].sort((a, b) => a.name.localeCompare(b.name)) }))
const allCities = countryGroups.flatMap((g) => g.cities)

/** Multi-select location filter: tri-state country checkboxes (all / some / none)
 *  select or clear all their cities; cities are individually selectable. */
function LocationFilter({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const label =
    value.length === 0
      ? "All locations"
      : value.length === 1
        ? allCities.find((c) => c.id === value[0])?.name ?? "1 location"
        : `${value.length} locations`
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  const Box = ({ state }: { state: "checked" | "indeterminate" | "unchecked" }) => {
    const filled = state !== "unchecked"
    return (
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded"
        style={{
          background: filled ? "var(--bg-primary-emphasis)" : "var(--bg-input-default)",
          border: `1px solid ${filled ? "var(--bg-primary-emphasis)" : "var(--border-input-default)"}`,
        }}
      >
        {state === "checked" && <Check className="size-3" style={{ color: "var(--fg-on-primary-emphasis)" }} />}
        {state === "indeterminate" && <Minus className="size-3" style={{ color: "var(--fg-on-primary-emphasis)" }} />}
      </span>
    )
  }
  const rowCls = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
  const cityCls = "flex w-full items-center gap-2 rounded-md py-1.5 pl-7 pr-2 text-left text-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors"
          style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)", color: "var(--fg-neutral-emphasis)" }}
        >
          <span>{label}</span>
          <ChevronDown className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1">
        <div className="max-h-72 overflow-y-auto">
          <button type="button" onClick={() => onChange([])} className={rowCls} style={{ color: "var(--fg-neutral-emphasis)" }}>
            <Box state={value.length === 0 ? "checked" : "unchecked"} />
            <span>All locations</span>
          </button>
          {countryGroups.map((g) => {
            const cityIds = g.cities.map((c) => c.id)
            const selCount = cityIds.filter((id) => value.includes(id)).length
            const countryState: "checked" | "indeterminate" | "unchecked" =
              selCount === 0 ? "unchecked" : selCount === cityIds.length ? "checked" : "indeterminate"
            // any selected → clear this country's cities; none selected → select them all
            const toggleCountry = () =>
              onChange(selCount > 0 ? value.filter((id) => !cityIds.includes(id)) : [...value, ...cityIds])
            return (
              <div key={g.name} className="pt-1">
                <button type="button" onClick={toggleCountry} className={rowCls}>
                  <Box state={countryState} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>{g.name}</span>
                  {selCount > 0 && <span className="ml-auto text-xs font-medium" style={{ color: "var(--fg-link-default)" }}>Clear</span>}
                </button>
                {g.cities.map((c) => (
                  <button key={c.id} type="button" onClick={() => toggle(c.id)} className={cityCls} style={{ color: "var(--fg-neutral-emphasis)" }}>
                    <Box state={value.includes(c.id) ? "checked" : "unchecked"} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
        {value.length > 0 && (
          <div className="mt-1 pt-1" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
            <button type="button" onClick={() => onChange([])} className={rowCls} style={{ color: "var(--fg-link-default)" }}>
              Clear selection
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function SortHeader({
  label, col, sortKey, sortDir, onSort, className,
}: {
  label: string; col: SortKey; sortKey: SortKey; sortDir: SortDir
  onSort: (c: SortKey) => void; className?: string
}) {
  const active = sortKey === col
  const Icon = !active ? ChevronsUpDown : sortDir === "asc" ? ChevronUp : ChevronDown
  return (
    <th className={"h-10 px-4 align-middle " + (className ?? "")}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:text-[var(--fg-neutral-emphasis)]"
        style={{ color: active ? "var(--fg-neutral-emphasis)" : "var(--fg-neutral-muted)" }}
      >
        {label}
        <Icon className="size-3.5" style={{ color: active ? "var(--fg-neutral-muted)" : "var(--fg-neutral-subtle)" }} />
      </button>
    </th>
  )
}

const CHUNK = 25 // rows added per lazy-load step

// nearest vertically-scrollable ancestor (the page content scroller), so the
// lazy-load observer fires whether the page or a container is doing the scrolling
function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  let el = node?.parentElement ?? null
  while (el) {
    const oy = getComputedStyle(el).overflowY
    if (oy === "auto" || oy === "scroll") return el
    el = el.parentElement
  }
  return null
}

export function EndpointsTable({
  locationIds,
  onLocationsChange,
  onOpenEndpoint,
}: {
  locationIds: string[]
  onLocationsChange: (ids: string[]) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
}) {
  const [search, setSearch] = useState("")
  // single source of truth for status filtering (empty = all). Landing on the
  // Endpoints tab defaults to the "Alerts only" triage view.
  const [statuses, setStatuses] = useState<EndpointStatus[]>(["critical", "warning"])
  const [sortKey, setSortKey] = useState<SortKey>("status")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [visible, setVisible] = useState(CHUNK)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // hide the Location column only when exactly one city is selected
  const showLocation = locationIds.length !== 1
  // the "Issues only" preset = exactly {critical, warning}
  const issuesActive = statuses.length === 2 && statuses.includes("critical") && statuses.includes("warning")
  const toggleStatus = (s: EndpointStatus) =>
    setStatuses((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]))

  const rows = useMemo(
    () => queryEndpoints({ search, locationIds, statuses, sortKey, sortDir }),
    [search, locationIds, statuses, sortKey, sortDir]
  )

  const shown = rows.slice(0, visible)
  const colCount = 2 + (showLocation ? 1 : 0) + 1 + 1 + 1

  const resetPage = () => setVisible(CHUNK)
  const onSort = (c: SortKey) => {
    if (c === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(c); setSortDir("asc") }
    resetPage()
  }

  // lazy-load: pull in more rows as the footer sentinel scrolls into view.
  // Re-armed on `visible` so it keeps filling while the sentinel stays in view.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisible((v) => Math.min(v + CHUNK, rows.length)) },
      { root: getScrollParent(el), rootMargin: "400px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rows.length, visible])

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      {/* header */}
      <div className="flex items-center gap-2 px-4 py-4">
        <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Endpoints</h2>
        <Badge variant="secondary">
          {rows.length.toLocaleString()} {issuesActive ? "with alerts" : rows.length === 1 ? "endpoint" : "endpoints"}
        </Badge>
      </div>

      {/* toolbar */}
      <div className="flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:items-center">
        <div className="flex h-9 w-full items-center gap-1.5 rounded-lg px-2.5 sm:max-w-xs" style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)" }}>
          <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            placeholder="Search endpoint, user or alert…"
            className="min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]"
            style={{ color: "var(--fg-neutral-emphasis)" }}
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => { setSearch(""); resetPage() }} className="flex size-5 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {/* quick-filter preset */}
          <Chip
            selected={issuesActive}
            aria-pressed={issuesActive}
            leading={issuesActive ? <Check /> : undefined}
            onClick={() => { setStatuses(issuesActive ? [] : ["critical", "warning"]); resetPage() }}
          >
            Alerts only
          </Chip>
          {/* divider separating quick-filter presets from precise filters */}
          <span className="mx-0.5 hidden h-5 w-px sm:block" style={{ background: "var(--border-neutral-muted)" }} aria-hidden />
          <LocationFilter value={locationIds} onChange={(ids) => { onLocationsChange(ids); resetPage() }} />
          <StatusFilter value={statuses} onToggle={(s) => { toggleStatus(s); resetPage() }} onClear={() => { setStatuses([]); resetPage() }} />
        </div>
      </div>

      {/* table */}
      <div className="w-full overflow-x-auto" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-neutral-muted)", background: "var(--bg-neutral-subtle)" }}>
              <SortHeader label="User / Machine" col="user" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />
              <SortHeader label="Status" col="status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />
              {showLocation && <SortHeader label="Location" col="location" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />}
              <SortHeader label="Clarity Network Score" col="score" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />
              <SortHeader label="Alert" col="event" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {shown.map((e, i) => {
              const isSel = openEndpointId === e.id
              const critN = e.events.filter((ev) => ev.severity === "critical").length
              const warnN = e.events.filter((ev) => ev.severity === "warning").length
              // tooltip on +N breaks down only the ADDITIONAL alerts (shown one excluded)
              const extraCrit = critN - (critN > 0 ? 1 : 0)
              const extraWarn = warnN - (critN > 0 ? 0 : 1)
              const moreBreakdown = [extraCrit ? `${extraCrit} critical` : "", extraWarn ? `${extraWarn} warning` : ""].filter(Boolean).join(" · ")
              return (
                <tr
                  key={e.id}
                  onClick={() => onOpenEndpoint(rows, i)}
                  className="group cursor-pointer transition-colors"
                  style={{
                    borderBottom: "1px solid var(--border-neutral-subtle)",
                    background: isSel ? "var(--bg-selected-subtle)" : "transparent",
                  }}
                  onMouseEnter={(ev) => { if (!isSel) ev.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.background = isSel ? "var(--bg-selected-subtle)" : "transparent" }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {e.status === "offline" ? (
                        <>
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
                            <Monitor className="size-4" />
                          </span>
                          <span className="truncate font-mono text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.machine}</span>
                        </>
                      ) : (
                        <>
                          <Avatar className="size-8"><AvatarFallback>{initials(e.user)}</AvatarFallback></Avatar>
                          <div className="flex min-w-px flex-col">
                            <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</span>
                            <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{e.machine}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge[e.status]} className="gap-1.5">
                      <span className="size-1.5 rounded-full" style={{ background: statusVar[e.status] }} />
                      {cap(e.status)}
                    </Badge>
                  </td>
                  {showLocation && (
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{e.locationName}</span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-sm font-medium"
                      style={{ color: e.score === null ? "var(--fg-neutral-subtle)" : e.status === "critical" ? "var(--fg-danger-emphasis)" : e.status === "warning" ? "var(--fg-warning-emphasis)" : "var(--fg-neutral-emphasis)" }}
                    >
                      {e.score === null ? "—" : e.score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {e.event ? (
                      <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
                        <span className="size-1.5 shrink-0 rounded-full" style={{ background: statusVar[e.status] }} />
                        {e.event}
                        {e.eventCount > 1 && e.eventAgo !== null && (
                          <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>· {formatAgo(e.eventAgo)} ago · </span>
                        )}
                        {e.eventCount > 1 && (
                          <span className="group/more relative text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>
                            +{e.eventCount - 1}
                            <span
                              role="tooltip"
                              className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium group-hover/more:block"
                              style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", boxShadow: "var(--shadow-md)" }}
                            >
                              {moreBreakdown}
                            </span>
                          </span>
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
              )
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    {issuesActive ? (
                      <>
                        <CircleCheck className="size-6" style={{ color: "var(--fg-success)" }} />
                        <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>All clear</span>
                        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No endpoints with alerts here. Turn off “Alerts only” to see all.</span>
                      </>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No endpoints match your filters.</span>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* footer doubles as the lazy-load sentinel — rows load automatically as it scrolls into view */}
      {rows.length > 0 && (
        <div ref={sentinelRef} className="flex items-center justify-center px-4 py-3 text-sm" style={{ borderTop: "1px solid var(--border-neutral-muted)", color: "var(--fg-neutral-muted)" }}>
          Showing {shown.length.toLocaleString()} of {rows.length.toLocaleString()} endpoints
        </div>
      )}
    </Card>
  )
}
