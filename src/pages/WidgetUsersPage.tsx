import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  ArrowDownUp, ChevronDown, ChevronsUpDown, ChevronUp, CircleMinus, Download, FlaskConical, Loader2,
  MoreHorizontal, RotateCcw, Search, Upload, UserPlus, UserRoundPlus, X,
} from "lucide-react"
import {
  Badge, Button, Card, Checkbox,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  EmptyState, InputGroup, InputGroupAddon, InputGroupInput, Progress, SegmentedControl, SegmentedControlItem, Select,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import {
  PAGE_SIZE, connectionLabel, createUser, downloadText, emptyQuery, fetchPage, removeUsers, runQuery,
  setActive, sizeMeta, stats, store, toCsv,
  type Connection, type DataSize, type Query, type SortKey, type WidgetUser,
} from "@/data/widgetUsers"
import {
  AddUserDialog, ConnectionBadge, CurrentCsvDialog, DeactivateDialog, RemoveDialog, type Target,
} from "@/components/admin/widget-users/dialogs"
import { ImportFlow } from "@/components/admin/widget-users/ImportFlow"

type View = "current" | "proposed"
// Module-level so the prototype remembers the view while you move between pages.
let rememberedView: View = "proposed"

const fmt = (n: number) => n.toLocaleString()
const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`
const displayName = (u: WidgetUser) => u.name.trim() || u.loginId

const sortLabel: Record<SortKey, string> = { hash: "Default order", name: "Name", added: "Recently added" }

export function WidgetUsersPage() {
  const version = useSyncExternalStore(store.subscribe, store.version)
  const size = store.size()
  const [view, setViewState] = useState<View>(rememberedView)
  const setView = (v: View) => { rememberedView = v; setViewState(v); clearSelection() }
  const proposed = view === "proposed"

  // ---- query -------------------------------------------------------------
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 300); return () => clearTimeout(t) }, [search])
  const [filters, setFilters] = useState<Pick<Query, "connection" | "status" | "sort">>({ connection: [], status: [], sort: "hash" })
  const query: Query = useMemo(
    () => (proposed ? { ...emptyQuery, q: debounced, ...filters } : { ...emptyQuery, q: debounced }),
    [proposed, debounced, filters],
  )
  const filtered = proposed && (filters.connection.length + filters.status.length > 0 || !!debounced)

  // ---- paged list, 15 at a time like the real API -----------------------
  const [rows, setRows] = useState<WidgetUser[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const reqId = useRef(0)

  const loadFirst = useCallback(async () => {
    const id = ++reqId.current
    setLoading(true)
    const page = await fetchPage(query, 0)
    if (id !== reqId.current) return
    setRows(page.users); setTotal(page.total); setHasMore(page.hasMore); setLoading(false)
  }, [query])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    const id = ++reqId.current
    setLoading(true)
    const page = await fetchPage(query, rows.length)
    if (id !== reqId.current) return
    setRows((r) => [...r, ...page.users]); setTotal(page.total); setHasMore(page.hasMore); setLoading(false)
  }, [loading, hasMore, query, rows.length])

  useEffect(() => { void loadFirst() }, [loadFirst])

  // After a change, re-read the pages already loaded (what the real list does on invalidate).
  const lastVersion = useRef(version)
  useEffect(() => {
    if (lastVersion.current === version) return
    lastVersion.current = version
    const all = runQuery(query)
    const keep = Math.max(rows.length, PAGE_SIZE)
    setRows(all.slice(0, keep)); setTotal(all.length); setHasMore(all.length > keep)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  const sentinel = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) void loadMore() }, { root: scroller.current, rootMargin: "200px" })
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore])

  // As built: sorting "User" reorders only the rows already in the browser.
  const [clientSort, setClientSort] = useState<"none" | "asc" | "desc">("none")
  const shown = useMemo(() => {
    if (proposed || clientSort === "none") return rows
    return [...rows].sort((a, b) => (clientSort === "asc" ? 1 : -1) * displayName(a).localeCompare(displayName(b)))
  }, [rows, proposed, clientSort])

  // ---- selection (proposed) ---------------------------------------------
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [allMatching, setAllMatching] = useState<{ count: number } | null>(null)
  function clearSelection() { setSelected(new Set()); setAllMatching(null) }
  useEffect(() => { clearSelection() }, [query])

  const loadedIds = shown.map((u) => u.userId)
  const allLoadedSelected = loadedIds.length > 0 && loadedIds.every((id) => selected.has(id))
  const someSelected = loadedIds.some((id) => selected.has(id))
  const selCount = allMatching ? allMatching.count : selected.size
  const toggleRow = (id: string) => {
    setAllMatching(null)
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleLoaded = () => {
    setAllMatching(null)
    setSelected(allLoadedSelected ? new Set() : new Set(loadedIds))
  }

  /** The users the action applies to. "All matching" is re-run now and checked
   *  against the count the admin agreed to — another admin may have changed it. */
  const resolveSelection = (): WidgetUser[] | null => {
    if (allMatching) {
      const now = runQuery(query)
      if (now.length !== allMatching.count) {
        toast({ title: "The list changed while you were working.", description: `${fmt(allMatching.count)} matched when you selected; ${fmt(now.length)} match now. Check the selection and try again.`, variant: "danger" })
        setAllMatching({ count: now.length })
        return null
      }
      return now
    }
    const set = selected
    return store.all().filter((u) => set.has(u.userId))
  }

  // ---- dialogs -----------------------------------------------------------
  const [addOpen, setAddOpen] = useState(false)
  const [csvOpen, setCsvOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Target | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Target | null>(null)

  const targetFor = (users: WidgetUser[]): Target => ({ users, count: users.length, label: users.length === 1 ? displayName(users[0]) : plural(users.length, "user") })
  /** Narrow a mixed selection to the users an action actually changes. */
  const onlyActive = (t: Target, active: boolean) => targetFor(t.users.filter((u) => u.active === active))

  // How many of the selection are active vs deactivated — decides which actions show.
  const selMix = useMemo(() => {
    const users = allMatching ? runQuery(query) : store.all().filter((u) => selected.has(u.userId))
    const active = users.filter((u) => u.active).length
    return { active, inactive: users.length - active }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, allMatching, query, version])
  const bulk = (fn: (t: Target) => void) => { const us = resolveSelection(); if (us && us.length) fn(targetFor(us)) }

  const doRemove = () => {
    if (!removeTarget) return
    const n = removeUsers(removeTarget.users.map((u) => u.userId))
    toast({ title: n === 1 ? `${removeTarget.label} was removed.` : `${fmt(n)} users were removed.`, description: "Recorded in the audit log." })
    setRemoveTarget(null); clearSelection()
  }
  const doDeactivate = (t: Target) => {
    const r = setActive(t.users.map((u) => u.userId), false)
    if (r.ok) toast({ title: r.changed === 1 ? `${t.label} was deactivated.` : `${fmt(r.changed)} users were deactivated.`, description: "Their licences are free. You can reactivate them any time." })
    setDeactivateTarget(null); setRemoveTarget(null); clearSelection()
  }
  const doReactivate = (t: Target) => {
    const r = setActive(t.users.map((u) => u.userId), true)
    if (!r.ok) { toast({ title: r.error, variant: "danger" }); return }
    toast({ title: r.changed === 1 ? `${t.label} was reactivated.` : `${fmt(r.changed)} users were reactivated.` })
    clearSelection()
  }
  const exportUsers = (users: WidgetUser[], name: string) => {
    downloadText(name, toCsv(users))
    toast({ title: `Exported ${plural(users.length, "user")}.`, description: "Same columns as the import template, so you can edit it and import it back." })
  }

  // As built: one click, no confirmation.
  const removeNow = (u: WidgetUser) => {
    removeUsers([u.userId])
    toast({ title: `${displayName(u)} was removed.` })
  }

  // ---- prototype helpers --------------------------------------------------
  const simulateOtherAdmin = () => {
    let added = 0
    for (let i = 0; i < 3; i++) {
      const id = Math.random().toString(36).slice(2, 7)
      if (createUser({ loginId: `corp\\other.admin.${id}`, name: `Added Elsewhere ${id}`, email: "", site: "Sydney" }).ok) added++
    }
    toast({ title: `Another admin added ${added} users.`, description: "Try confirming a \"select all matching\" action now.", variant: "info" })
  }

  const s = stats()
  const pct = s.limit ? Math.min(100, (s.active / s.limit) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Prototype controls — not part of the design */}
      <Card className="flex flex-row flex-wrap items-center gap-x-6 gap-y-3 border-dashed px-4 py-3">
        <Badge color="info" className="gap-1"><FlaskConical className="size-3.5" /> Prototype</Badge>
        <Ctl label="View">
          <SegmentedControl value={view} onValueChange={(v: string) => setView(v as View)} size="sm">
            <SegmentedControlItem value="current">As built today</SegmentedControlItem>
            <SegmentedControlItem value="proposed">Proposed</SegmentedControlItem>
          </SegmentedControl>
        </Ctl>
        <Ctl label="Users">
          <SegmentedControl value={size} onValueChange={(v: string) => { store.setSize(v as DataSize); clearSelection() }} size="sm">
            {(Object.keys(sizeMeta) as DataSize[]).map((k) => <SegmentedControlItem key={k} value={k}>{sizeMeta[k].label}</SegmentedControlItem>)}
          </SegmentedControl>
        </Ctl>
        <div className="ms-auto flex gap-2">
          {proposed && <Button variant="ghost" size="sm" onClick={simulateOtherAdmin}><UserRoundPlus /> Another admin adds 3</Button>}
          <Button variant="ghost" size="sm" onClick={() => { store.reset(); clearSelection() }}><RotateCcw /> Reset data</Button>
        </div>
      </Card>

      <Progress label="Clarion licenses in use" value={pct} valueLabel={`${fmt(s.active)}/${fmt(s.limit)}`} />

      <Card className="gap-0 overflow-hidden p-0">
        {/* header */}
        <div className="flex flex-col gap-4 p-5 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserPlus className="size-5 text-content-neutral-muted" />
              <h2 className="text-heading-xs text-content-neutral-emphasis">Clarion widget users</h2>
              {proposed && <Badge>{filtered ? `${fmt(total)} of ${fmt(s.total)}` : fmt(s.total)}</Badge>}
            </div>
            <div className="flex flex-wrap gap-2">
              {proposed ? (
                <>
                  {/* Exports what you're looking at: everyone, or the filtered set. */}
                  <Button variant="outline" onClick={() => exportUsers(filtered ? runQuery(query) : store.all(), "clarion-widget-users.csv")}>
                    <Download /> Export
                  </Button>
                  <Button variant="outline" onClick={() => setImportOpen(true)}><Upload /> Import</Button>
                  <Button onClick={() => setAddOpen(true)}>Add user</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setCsvOpen(true)}>CSV bulk upload</Button>
                  <Button onClick={() => setAddOpen(true)}>Add users</Button>
                </>
              )}
            </div>
          </div>

          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <InputGroup className="w-72">
              <InputGroupAddon><Search /></InputGroupAddon>
              <InputGroupInput placeholder={proposed ? "Search name, login ID, email or site" : "Search users by name, login or email..."} value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <InputGroupAddon align="end"><button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X className="size-4" /></button></InputGroupAddon>}
            </InputGroup>
            {proposed && (
              <>
                <div className="w-44"><Select size="md" label="Widget" value={filters.connection}
                  options={(["connected", "never", "invite_failed"] as Connection[]).map((c) => ({ value: c, label: connectionLabel[c] }))}
                  onValueChange={(v) => setFilters({ ...filters, connection: v as Connection[] })} /></div>
                <div className="w-40"><Select size="md" label="Status" value={filters.status}
                  options={[{ value: "active", label: "Active" }, { value: "deactivated", label: "Deactivated" }]}
                  onValueChange={(v) => setFilters({ ...filters, status: v as Query["status"] })} /></div>
                {(filters.connection.length + filters.status.length > 0) && (
                  <Button variant="ghost" size="sm" onClick={() => setFilters({ ...filters, connection: [], status: [] })}>Clear filters</Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="ms-auto"><ArrowDownUp /> {sortLabel[filters.sort]}</Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(Object.keys(sortLabel) as SortKey[]).map((k) => <DropdownMenuItem key={k} onSelect={() => setFilters({ ...filters, sort: k })}>{sortLabel[k]}</DropdownMenuItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* "select all matching" — the Gmail pattern */}
        {proposed && allLoadedSelected && !allMatching && total > loadedIds.length && (
          <div className="flex items-center justify-center gap-2 border-t border-line-neutral-muted bg-surface-selected-subtle px-4 py-2 text-body-sm text-content-neutral-emphasis">
            All {fmt(loadedIds.length)} loaded users are selected.
            <Button variant="link" size="xs" onClick={() => setAllMatching({ count: total })}>Select all {fmt(total)} {filtered ? "matching users" : "users"}</Button>
          </div>
        )}
        {proposed && allMatching && (
          <div className="flex items-center justify-center gap-2 border-t border-line-neutral-muted bg-surface-selected-subtle px-4 py-2 text-body-sm text-content-neutral-emphasis">
            All {fmt(allMatching.count)} {filtered ? "matching users" : "users"} are selected, including ones not loaded yet.
            <Button variant="link" size="xs" onClick={clearSelection}>Clear selection</Button>
          </div>
        )}

        {/* table */}
        <div ref={scroller} className="max-h-[560px] overflow-y-auto">
          {!loading && shown.length === 0 ? (
            <div className="py-10">
              <EmptyState size="sm" icon={<Search />}
                title={debounced || filtered ? "No users match" : "You currently don't have any widget users"}
                description={debounced || filtered ? "Try a different search or clear the filters." : "Add users one at a time, or import a CSV."} />
            </div>
          ) : (
            <Table size="sm">
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  {proposed && (
                    <TableHead className="w-10">
                      <Checkbox aria-label="Select loaded users" checked={allMatching || allLoadedSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={toggleLoaded} />
                    </TableHead>
                  )}
                  <TableHead className="text-start">
                    {proposed ? "User" : (
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => setClientSort(clientSort === "asc" ? "desc" : "asc")}>
                        User {clientSort === "none" ? <ChevronsUpDown className="size-3.5" /> : clientSort === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </button>
                    )}
                  </TableHead>
                  <TableHead className="text-start">Login ID</TableHead>
                  {!proposed && <TableHead className="text-start">Email</TableHead>}
                  <TableHead className="text-start">Site</TableHead>
                  {proposed && <TableHead className="text-start">Widget</TableHead>}
                  {proposed && <TableHead className="text-start">Status</TableHead>}
                  <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((u) => {
                  const isSel = allMatching ? true : selected.has(u.userId)
                  return (
                    <TableRow key={u.userId} selected={proposed && isSel} className={!u.active && proposed ? "text-content-neutral-muted" : undefined}>
                      {proposed && (
                        <TableCell><Checkbox aria-label={`Select ${displayName(u)}`} checked={isSel} onCheckedChange={() => toggleRow(u.userId)} /></TableCell>
                      )}
                      <TableCell className="max-w-56">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate">{displayName(u)}</span>
                          {proposed && <span className="truncate text-body-sm text-content-neutral-muted">{u.email || "No email"}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-56 truncate font-mono text-body-sm">{u.loginId}</TableCell>
                      {!proposed && <TableCell className="max-w-64 truncate">{u.email || "-"}</TableCell>}
                      <TableCell className="max-w-40 truncate">{u.site || (proposed ? <span className="text-content-neutral-subtle">—</span> : "-")}</TableCell>
                      {proposed && <TableCell><ConnectionBadge user={u} /></TableCell>}
                      {proposed && <TableCell>{u.active ? <Badge color="success">Active</Badge> : <Badge>Deactivated</Badge>}</TableCell>}
                      <TableCell>
                        {proposed ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="xs" aria-label={`Actions for ${displayName(u)}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {u.active
                                ? <DropdownMenuItem onSelect={() => setDeactivateTarget(targetFor([u]))}>Deactivate</DropdownMenuItem>
                                : <DropdownMenuItem onSelect={() => doReactivate(targetFor([u]))}>Reactivate</DropdownMenuItem>}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onSelect={() => setRemoveTarget(targetFor([u]))}>Remove…</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <button type="button" title={`Remove ${displayName(u)}`} aria-label={`Remove ${displayName(u)}`} onClick={() => removeNow(u)}
                            className="flex size-8 items-center justify-center rounded-md text-content-danger-emphasis hover:bg-surface-danger-subtle">
                            <CircleMinus className="size-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <div ref={sentinel} className="h-px" />
          {loading && (
            <div className="flex items-center justify-center gap-2 py-3 text-body-sm text-content-neutral-muted"><Loader2 className="size-4 animate-spin" /> Loading users…</div>
          )}
        </div>
        {proposed && (
          <div className="border-t border-line-neutral-muted px-5 py-2 text-body-sm text-content-neutral-muted">
            {fmt(rows.length)} of {fmt(total)} loaded · 15 per request, like the real API
          </div>
        )}
      </Card>

      {/* floating bulk bar */}
      {proposed && selCount > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line-neutral-muted bg-surface-overlay px-3 py-2 shadow-lg">
            <span className="px-1 text-label-md text-content-neutral-emphasis">{fmt(selCount)} selected</span>
            {!allMatching && total > selCount && (
              <Button variant="link" size="xs" onClick={() => setAllMatching({ count: total })}>Select all {fmt(total)}</Button>
            )}
            <span className="mx-1 h-5 w-px bg-line-neutral-muted" />
            {/* Only what applies: you can't deactivate the deactivated or reactivate the active. */}
            {selMix.active > 0 && (
              <Button variant="outline" size="sm" onClick={() => bulk((t) => setDeactivateTarget(onlyActive(t, true)))}>
                Deactivate{selMix.inactive > 0 ? ` ${fmt(selMix.active)}` : ""}
              </Button>
            )}
            {selMix.inactive > 0 && (
              <Button variant="outline" size="sm" onClick={() => bulk((t) => doReactivate(onlyActive(t, false)))}>
                Reactivate{selMix.active > 0 ? ` ${fmt(selMix.inactive)}` : ""}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { const us = resolveSelection(); if (us) exportUsers(us, "clarion-widget-users-selected.csv") }}><Download /> Export</Button>
            <Button variant="destructive" size="sm" onClick={() => bulk(setRemoveTarget)}>Remove…</Button>
            <Button variant="ghost" size="xs" aria-label="Clear selection" onClick={clearSelection}><X /></Button>
          </div>
        </div>
      )}

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} proposed={proposed} />
      <CurrentCsvDialog open={csvOpen} onOpenChange={setCsvOpen} />
      <ImportFlow open={importOpen} onOpenChange={setImportOpen} />
      <RemoveDialog open={!!removeTarget} onOpenChange={(o) => { if (!o) setRemoveTarget(null) }} target={removeTarget}
        onRemove={doRemove} onDeactivateInstead={() => { if (removeTarget) { setDeactivateTarget(onlyActive(removeTarget, true)); setRemoveTarget(null) } }} />
      <DeactivateDialog open={!!deactivateTarget} onOpenChange={(o) => { if (!o) setDeactivateTarget(null) }} target={deactivateTarget}
        onConfirm={() => deactivateTarget && doDeactivate(deactivateTarget)} />
    </div>
  )
}

function Ctl({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center gap-2"><span className="text-label-sm text-content-neutral-muted">{label}</span>{children}</div>
}
