import { useEffect, useRef, useState } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { Topbar } from "@/components/dashboard/Topbar"
import { OverviewPage } from "@/pages/OverviewPage"
import { EndpointsPage } from "@/pages/EndpointsPage"
import { AlertsPage } from "@/pages/AlertsPage"
import { ThresholdsPage } from "@/pages/ThresholdsPage"
import { GlossaryPage } from "@/pages/GlossaryPage"
import { IssuesDocPage } from "@/pages/IssuesDocPage"
import { DevicesModelPage } from "@/pages/DevicesModelPage"
import { ComponentsPage } from "@/pages/ComponentsPage"
import { AdminApp } from "@/AdminApp"
import { EndpointDrawer } from "@/components/endpoints/drawer/EndpointDrawer"
import { AlertDrawer } from "@/components/alerts/AlertDrawer"
import { CommandPalette } from "@/components/search/CommandPalette"
import { Toaster } from "@/components/ui/toast"
import { useStreaming } from "@/hooks/useStreaming"
import { DEFAULT_LOCATION, locationById } from "@/data/dashboard"
import type { Endpoint, Rollup, RollupCause } from "@/data/endpoints"
import { rollupsForLocation, rollupsAll, queryEndpoints, endpointById } from "@/data/endpoints"
import { pageLabel, pageSubtitle, pageFromPath, buildPath, readDrawerParams, experienceOf, defaultPageFor, type PageId, type Experience } from "@/nav"

// map a real-time alert type to the issue cause it belongs to
const alertTypeToCause: Record<string, RollupCause> = {
  "Platform outage": "platform",
  "High latency": "latency",
  "Packet loss": "loss",
  "Network jitter": "jitter",
}

type DeviceDrawer = { rows: Endpoint[]; index: number }
type IssueDrawer = { rows: Rollup[]; index: number; expanded?: boolean }

// Rebuild the drawers from the URL (deep-link or browser back/forward). The URL
// only carries the id, so we reconstruct a sensible row context for prev/next:
// for a device, its location's list; for an issue, the full issue list.
function deviceDrawerFromUrl(): DeviceDrawer | null {
  const { device } = readDrawerParams(window.location.search)
  if (!device) return null
  const e = endpointById(device)
  if (!e) return null
  const rows = queryEndpoints({ locationIds: [e.locationId] })
  const index = rows.findIndex((r) => r.id === device)
  return index >= 0 ? { rows, index } : { rows: [e], index: 0 }
}

function issueDrawerFromUrl(): IssueDrawer | null {
  const { issue } = readDrawerParams(window.location.search)
  if (!issue) return null
  const rows = rollupsAll()
  const index = rows.findIndex((r) => r.id === issue)
  return index >= 0 ? { rows, index } : null
}

export default function App() {
  const [dark, setDark] = useState(false)
  const [page, setPage] = useState<PageId>(() => pageFromPath(window.location.pathname))
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_LOCATION)
  const [endpointFilters, setEndpointFilters] = useState<string[]>([])
  const [alertFilter, setAlertFilter] = useState<string>("all")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [drawer, setDrawer] = useState<DeviceDrawer | null>(() => deviceDrawerFromUrl())
  const [alertDrawer, setAlertDrawer] = useState<IssueDrawer | null>(() => issueDrawerFromUrl())
  const [backAlert, setBackAlert] = useState<IssueDrawer | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const live = useStreaming()
  // remembers the last synced page + open-drawer flags, to decide push vs replace
  const histPrev = useRef({ page, device: drawer !== null, issue: alertDrawer !== null })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  // keep the URL in sync with page + open drawer (shareable, deep-linkable).
  // push on page change / drawer open (so Back closes the drawer); replace on
  // in-drawer prev-next and on close (so Back doesn't step through each row).
  useEffect(() => {
    const device = drawer ? drawer.rows[drawer.index]?.id : undefined
    const issue = alertDrawer ? alertDrawer.rows[alertDrawer.index]?.id : undefined
    const url = buildPath(page, { device, issue })
    const current = window.location.pathname + window.location.search
    if (current !== url) {
      const opened = (!histPrev.current.device && drawer !== null) || (!histPrev.current.issue && alertDrawer !== null)
      const pageChanged = histPrev.current.page !== page
      if (opened || pageChanged) window.history.pushState(null, "", url)
      else window.history.replaceState(null, "", url)
    }
    histPrev.current = { page, device: drawer !== null, issue: alertDrawer !== null }
  }, [page, drawer, alertDrawer])

  // back/forward buttons → rebuild page + drawers from the URL
  useEffect(() => {
    const onPop = () => {
      setPage(pageFromPath(window.location.pathname))
      setDrawer(deviceDrawerFromUrl())
      setAlertDrawer(issueDrawerFromUrl())
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  // ⌘K / Ctrl-K opens the command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Navigating to another page closes any open drawer (a drilldown belongs to
  // the page it was opened from).
  const navigate = (p: PageId) => { setDrawer(null); setAlertDrawer(null); setPage(p) }

  const handleViewEndpoints = (loc?: string | string[]) => {
    if (Array.isArray(loc)) setEndpointFilters(loc)
    else {
      const id = loc ?? selectedId
      setEndpointFilters(id === "all" ? [] : [id])
    }
    navigate("endpoints")
  }

  const handleViewAllAlerts = () => {
    setAlertFilter(selectedId === "all" ? "all" : selectedId)
    navigate("alerts")
  }

  const openEndpointId = drawer ? drawer.rows[drawer.index]?.id ?? null : null
  const openAlertId = alertDrawer ? alertDrawer.rows[alertDrawer.index]?.id ?? null : null

  const switchExperience = (e: Experience) => navigate(defaultPageFor[e])

  // The Administration experience is its own shell (own sidebar + chrome),
  // sharing this repo's design system. Reached via the top-right account menu.
  if (experienceOf(page) === "admin") {
    return (
      <AdminApp
        page={page}
        onNavigate={navigate}
        dark={dark}
        onToggleTheme={() => setDark((v) => !v)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onSwitchExperience={switchExperience}
      />
    )
  }

  return (
    <div className="flex h-screen w-full items-start overflow-hidden" style={{ background: "var(--bg-app)" }}>
      {sidebarOpen && (
        <Sidebar active={page} onNavigate={navigate} secondsAgo={live.secondsAgo} />
      )}

      <div
        className="flex h-full min-w-px flex-1 flex-col overflow-hidden"
        style={{
          borderLeft: "1px solid var(--border-neutral-muted)",
          borderRight: "1px solid var(--border-neutral-muted)",
        }}
      >
        <Topbar
          page={page}
          dark={dark}
          onToggleTheme={() => setDark((v) => !v)}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onOpenSearch={() => setSearchOpen(true)}
          onSwitchExperience={switchExperience}
          onViewIssues={() => { setAlertFilter("all"); navigate("alerts") }}
          onAlertNavigate={(a) => {
            if (a.navTo === "endpoints") {
              setEndpointFilters(a.locationId ? [a.locationId] : [])
              navigate("endpoints")
              return
            }
            // navigate to Issues (filtered) AND open the related issue drilldown
            setAlertFilter(a.locationId ?? "all")
            navigate("alerts")
            const rows = a.locationId ? rollupsForLocation(a.locationId) : rollupsAll()
            if (rows.length) {
              const cause = alertTypeToCause[a.type]
              const idx = Math.max(0, rows.findIndex((r) => r.cause === cause))
              setAlertDrawer({ rows, index: idx, expanded: true })
            }
          }}
        />

        <div className="shrink-0 p-5" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
          <h1 className="text-xl font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
            {page === "endpoints" && endpointFilters.length > 0 ? (
              <>
                Devices{" "}
                <span style={{ color: "var(--fg-neutral-subtle)" }}>
                  — {endpointFilters.length === 1 ? locationById(endpointFilters[0])?.name : `${endpointFilters.length} locations`}
                </span>
              </>
            ) : (
              pageLabel(page)
            )}
          </h1>
          {pageSubtitle[page] && (
            <p className="mt-1 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{pageSubtitle[page]}</p>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {page === "overview" && (
            <OverviewPage
              live={live}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onViewEndpoints={handleViewEndpoints}
              onViewAllAlerts={handleViewAllAlerts}
              onOpenAlert={(rollups, index) => setAlertDrawer({ rows: rollups, index })}
            />
          )}
          {page === "endpoints" && (
            <EndpointsPage
              locationIds={endpointFilters}
              onLocationsChange={setEndpointFilters}
              onOpenEndpoint={(rows, index) => setDrawer({ rows, index })}
              openEndpointId={openEndpointId}
            />
          )}
          {page === "alerts" && (
            <AlertsPage
              locationId={alertFilter}
              onLocationChange={setAlertFilter}
              onOpenAlert={(rollups, index) => setAlertDrawer({ rows: rollups, index })}
              openAlertId={openAlertId}
            />
          )}
          {page === "thresholds" && <ThresholdsPage />}
          {page === "glossary" && <GlossaryPage />}
          {page === "devicesdoc" && <DevicesModelPage />}
          {page === "issuesdoc" && <IssuesDocPage />}
          {page === "components" && <ComponentsPage />}
        </div>
      </div>

      {/* global endpoint drilldown */}
      <EndpointDrawer
        rows={drawer?.rows ?? []}
        index={drawer?.index ?? 0}
        open={drawer !== null}
        onIndexChange={(i) => setDrawer((d) => (d ? { ...d, index: i } : d))}
        onOpenChange={(o) => { if (!o) { setDrawer(null); setBackAlert(null) } }}
        backLabel={backAlert ? backAlert.rows[backAlert.index]?.title : undefined}
        onBack={backAlert ? () => { setDrawer(null); setAlertDrawer(backAlert); setBackAlert(null) } : undefined}
      />

      {/* alert rollup drilldown */}
      <AlertDrawer
        rows={alertDrawer?.rows ?? []}
        index={alertDrawer?.index ?? 0}
        defaultExpanded={alertDrawer?.expanded ?? false}
        open={alertDrawer !== null}
        onIndexChange={(i) => setAlertDrawer((d) => (d ? { ...d, index: i } : d))}
        onOpenChange={(o) => { if (!o) setAlertDrawer(null) }}
        onOpenEndpoint={(rows, index) => { setBackAlert(alertDrawer); setAlertDrawer(null); setDrawer({ rows, index }) }}
      />

      {/* transient toasts (save confirmations, etc.) */}
      <Toaster />

      {/* global command palette */}
      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onPickEndpoint={(e) => setDrawer({ rows: [e], index: 0 })}
        onPickLocation={(id) => { setEndpointFilters([id]); navigate("endpoints") }}
      />
    </div>
  )
}
