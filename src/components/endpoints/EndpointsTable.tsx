import { useMemo, useState, type ReactNode } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, CircleCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { LocalSearch } from "@/components/search/LocalSearch"
import { locations } from "@/data/dashboard"
import { endpoints as allEndpoints, queryEndpoints, type Endpoint, type EndpointStatus, type SortKey, type SortDir } from "@/data/endpoints"

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
  locationId,
  onLocationChange,
  onOpenEndpoint,
  openEndpointId,
}: {
  locationId: string
  onLocationChange: (id: string) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
  openEndpointId?: string | null
}) {
  const [status, setStatus] = useState<EndpointStatus | "all">("all")
  const [issuesOnly, setIssuesOnly] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>("status")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  const showLocation = locationId === "all"
  // "Issues only" applies unless the user has picked an explicit status
  const issuesActive = issuesOnly && status === "all"

  const rows = useMemo(() => {
    let r = queryEndpoints({ locationId, status, sortKey, sortDir })
    if (issuesActive) r = r.filter((e) => e.status !== "healthy")
    return r
  }, [locationId, status, sortKey, sortDir, issuesActive])

  // typeahead searches the page's endpoints (scoped to the current location)
  const searchData = useMemo(
    () => allEndpoints.filter((e) => locationId === "all" || e.locationId === locationId),
    [locationId]
  )

  // adaptive: only show the Primary issue column when something is actually wrong
  const showIssue = useMemo(() => rows.some((e) => e.primaryIssue !== null), [rows])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize)
  const colCount = 2 + (showLocation ? 1 : 0) + 1 + (showIssue ? 1 : 0) + 1

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
        <span
          className="flex h-5 items-center rounded-full px-2 text-xs font-medium"
          style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}
        >
          {rows.length.toLocaleString()} {issuesActive ? "with issues" : rows.length === 1 ? "endpoint" : "endpoints"}
        </span>
      </div>

      {/* toolbar */}
      <div className="flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:items-center">
        <LocalSearch
          placeholder="Search user or machine…"
          data={searchData}
          toText={(e) => `${e.user} ${e.machine}`}
          onSelect={(e) => onOpenEndpoint([e], 0)}
          renderRow={(e) => (
            <>
              <Avatar className="size-7"><AvatarFallback>{initials(e.user)}</AvatarFallback></Avatar>
              <div className="flex min-w-px flex-1 flex-col">
                <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</span>
                <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{e.machine} · {e.locationName}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
                <span className="size-1.5 rounded-full" style={{ background: statusVar[e.status] }} />
                {e.score === null ? "—" : e.score.toFixed(1)}
              </span>
            </>
          )}
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={() => { setIssuesOnly((v) => { const next = !v; if (next) setStatus("all"); return next }); resetPage() }}
            className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors"
            style={issuesOnly
              ? { background: "var(--bg-primary-subtle)", color: "var(--fg-primary-emphasis)", border: "1px solid var(--border-primary-muted)" }
              : { background: "var(--bg-input-default)", color: "var(--fg-neutral-muted)", border: "1px solid var(--border-input-default)" }}
          >
            Issues only
          </button>
          <Select value={locationId} onValueChange={(v) => { onLocationChange(v); resetPage() }}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { const s = v as EndpointStatus | "all"; setStatus(s); if (s !== "all") setIssuesOnly(false); resetPage() }}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
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
              <SortHeader label="Clarity Score" col="score" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />
              {showIssue && <SortHeader label="Symptom" col="issue" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />}
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
                  {showLocation && (
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{e.locationName} · {e.site}</span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-sm font-medium"
                      style={{ color: e.score === null ? "var(--fg-neutral-subtle)" : e.status === "critical" ? "var(--fg-danger)" : e.status === "warning" ? "var(--fg-warning)" : "var(--fg-neutral-emphasis)" }}
                    >
                      {e.score === null ? "—" : e.score.toFixed(1)}
                    </span>
                  </td>
                  {showIssue && (
                    <td className="px-4 py-3">
                      {e.primaryIssue ? (
                        <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
                          <span className="size-1.5 rounded-full" style={{ background: statusVar[e.status] }} />
                          {e.primaryIssue}
                        </span>
                      ) : (
                        <span className="text-sm" style={{ color: "var(--fg-neutral-subtle)" }}>—</span>
                      )}
                    </td>
                  )}
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
                        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No endpoints with issues here. Turn off “Issues only” to see all.</span>
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
