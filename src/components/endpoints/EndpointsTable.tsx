import { useMemo, useState, useEffect, type ReactNode } from "react"
import { Search, X, Check, Monitor, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, CircleCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Chip } from "@/components/ui/chip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { countries, citiesInCountry } from "@/data/dashboard"
import { queryEndpoints, type Endpoint, type EndpointStatus, type SortKey, type SortDir } from "@/data/endpoints"

// Locations grouped under their country (label only — cities are selectable), all alphabetical.
const countryGroups = [...countries]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({ name: c.name, cities: [...citiesInCountry(c.id)].sort((a, b) => a.name.localeCompare(b.name)) }))
const allCities = countryGroups.flatMap((g) => g.cities)

/** Multi-select location filter: country headings are labels, cities are checkboxes. */
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

  const Box = ({ on }: { on: boolean }) => (
    <span
      className="flex size-4 shrink-0 items-center justify-center rounded"
      style={{
        background: on ? "var(--bg-primary-emphasis)" : "var(--bg-input-default)",
        border: `1px solid ${on ? "var(--bg-primary-emphasis)" : "var(--border-input-default)"}`,
      }}
    >
      {on && <Check className="size-3" style={{ color: "var(--fg-on-primary-emphasis)" }} />}
    </span>
  )
  const rowCls = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"

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
      <PopoverContent align="end" className="w-60 p-1">
        <div className="max-h-72 overflow-y-auto">
          <button type="button" onClick={() => onChange([])} className={rowCls} style={{ color: "var(--fg-neutral-emphasis)" }}>
            <Box on={value.length === 0} />
            <span>All locations</span>
          </button>
          {countryGroups.map((g) => (
            <div key={g.name}>
              <div className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>{g.name}</div>
              {g.cities.map((c) => (
                <button key={c.id} type="button" onClick={() => toggle(c.id)} className={rowCls} style={{ color: "var(--fg-neutral-emphasis)" }}>
                  <Box on={value.includes(c.id)} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          ))}
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

const statusVar: Record<EndpointStatus, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  offline: "var(--status-unknown)",
}
const statusBadge: Record<EndpointStatus, "success" | "warning" | "danger" | "secondary"> = {
  healthy: "success", warning: "warning", critical: "danger", offline: "secondary",
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

// status options ordered worst-first, offline last
const STATUS_OPTIONS: { id: EndpointStatus; label: string }[] = [
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warning" },
  { id: "healthy", label: "Healthy" },
  { id: "offline", label: "Offline" },
]

/** Multi-select status filter (empty = all statuses). */
function StatusFilter({ value, onToggle, onClear }: { value: EndpointStatus[]; onToggle: (s: EndpointStatus) => void; onClear: () => void }) {
  const [open, setOpen] = useState(false)
  const label = value.length === 0 ? "All statuses" : value.length === 1 ? cap(value[0]) : `${value.length} statuses`
  const rowCls = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm shadow-xs transition-colors hover:border-[var(--border-input-hovered)]"
          style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)", color: "var(--fg-neutral-emphasis)" }}>
          <span>{label}</span>
          <ChevronDown className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        {STATUS_OPTIONS.map((o) => {
          const on = value.includes(o.id)
          return (
            <button key={o.id} type="button" role="option" aria-selected={on} onClick={() => onToggle(o.id)} className={rowCls} style={{ color: "var(--fg-neutral-emphasis)" }}>
              <span className="flex size-4 shrink-0 items-center justify-center rounded" style={{ background: on ? "var(--bg-primary-emphasis)" : "var(--bg-input-default)", border: `1px solid ${on ? "var(--bg-primary-emphasis)" : "var(--border-input-default)"}` }}>
                {on && <Check className="size-3" style={{ color: "var(--fg-on-primary-emphasis)" }} />}
              </span>
              <span className="size-2 shrink-0 rounded-full" style={{ background: statusVar[o.id] }} />
              <span className="flex-1">{o.label}</span>
            </button>
          )
        })}
        {value.length > 0 && (
          <div className="mt-1 pt-1" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
            <button type="button" onClick={onClear} className={rowCls} style={{ color: "var(--fg-link-default)" }}>Clear</button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | "…")[] = [1]
  const lo = Math.max(2, current - 1)
  const hi = Math.min(total - 1, current + 1)
  if (lo > 2) out.push("…")
  for (let i = lo; i <= hi; i++) out.push(i)
  if (hi < total - 1) out.push("…")
  out.push(total)
  return out
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

const PAGE_SIZES = [10, 15, 25, 50]

export function EndpointsTable({
  locationIds,
  onLocationsChange,
  onOpenEndpoint,
  openEndpointId,
  showAll = false,
}: {
  locationIds: string[]
  onLocationsChange: (ids: string[]) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
  openEndpointId?: string | null
  /** Opened via "View devices": show all statuses (Issues only off) when the
   *  scope has healthy devices, so they aren't hidden behind the triage default. */
  showAll?: boolean
}) {
  const [search, setSearch] = useState("")
  // single source of truth for status filtering (empty = all). Default = the
  // "Issues only" triage view, unless opened via "View devices" on a scope that
  // has healthy devices — then start with everything shown.
  const [statuses, setStatuses] = useState<EndpointStatus[]>(() =>
    showAll && queryEndpoints({ locationIds, statuses: ["healthy"] }).length > 0
      ? []
      : ["critical", "warning"]
  )
  const [sortKey, setSortKey] = useState<SortKey>("status")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

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

  // keep the table page in sync with the row open in the drawer (so flicking
  // ↑/↓ past a page boundary keeps the in-view row visible & highlighted)
  useEffect(() => {
    if (!openEndpointId) return
    const idx = rows.findIndex((e) => e.id === openEndpointId)
    if (idx < 0) return
    const target = Math.floor(idx / pageSize) + 1
    setPage((p) => (p === target ? p : target))
  }, [openEndpointId, rows, pageSize])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize)
  const colCount = 2 + (showLocation ? 1 : 0) + 1 + 1 + 1

  const onSort = (c: SortKey) => {
    if (c === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(c); setSortDir("asc") }
    setPage(1)
  }
  const resetPage = () => setPage(1)

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      {/* header */}
      <div className="flex items-center gap-2 px-4 py-4">
        <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Endpoints</h2>
        <Badge variant="secondary">
          {rows.length.toLocaleString()} {issuesActive ? "with issues" : rows.length === 1 ? "endpoint" : "endpoints"}
        </Badge>
      </div>

      {/* toolbar */}
      <div className="flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:items-center">
        <div className="flex h-9 w-full items-center gap-1.5 rounded-lg px-2.5 sm:max-w-xs" style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)" }}>
          <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            placeholder="Search endpoint, user or event…"
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
            Issues only
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
              <SortHeader label="Event" col="event" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((e, i) => {
              const absoluteIndex = (safePage - 1) * pageSize + i
              const isSel = openEndpointId === e.id
              return (
                <tr
                  key={e.id}
                  onClick={() => onOpenEndpoint(rows, absoluteIndex)}
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
                      <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{e.locationName} · {e.site}</span>
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
              )
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    {issuesActive ? (
                      <>
                        <CircleCheck className="size-6" style={{ color: "var(--fg-success)" }} />
                        <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>All clear</span>
                        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No devices with issues here. Turn off “Issues only” to see all.</span>
                      </>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No devices match your filters.</span>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* footer / pagination */}
      <div className="flex flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-between" style={{ borderTop: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex items-center gap-3 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          <span>Page {safePage} of {totalPages}</span>
          <span style={{ color: "var(--border-neutral-emphasis)" }}>·</span>
          <span className="flex items-center gap-2">
            Rows per page
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <PagerBtn disabled={safePage === 1} onClick={() => setPage(1)}><ChevronsLeft className="size-4" /></PagerBtn>
          <PagerBtn disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><ChevronLeft className="size-4" /></PagerBtn>
          {pageList(safePage, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-1 text-sm" style={{ color: "var(--fg-neutral-subtle)" }}>…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className="flex size-8 items-center justify-center rounded-md text-sm font-medium transition-colors"
                style={p === safePage
                  ? { background: "var(--bg-selected-subtle)", color: "var(--fg-primary-emphasis)" }
                  : { color: "var(--fg-neutral-muted)" }}
                onMouseEnter={(ev) => { if (p !== safePage) ev.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
                onMouseLeave={(ev) => { if (p !== safePage) ev.currentTarget.style.background = "transparent" }}
              >
                {p}
              </button>
            )
          )}
          <PagerBtn disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight className="size-4" /></PagerBtn>
          <PagerBtn disabled={safePage === totalPages} onClick={() => setPage(totalPages)}><ChevronsRight className="size-4" /></PagerBtn>
        </div>
      </div>
    </Card>
  )
}

function PagerBtn({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-40"
      style={{ color: "var(--fg-neutral-muted)" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
    >
      {children}
    </button>
  )
}
