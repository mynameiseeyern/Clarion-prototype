import { useEffect, useState } from "react"
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
import { EndpointDrawer } from "@/components/endpoints/drawer/EndpointDrawer"
import { AlertDrawer } from "@/components/alerts/AlertDrawer"
import { CommandPalette } from "@/components/search/CommandPalette"
import { useStreaming } from "@/hooks/useStreaming"
import { DEFAULT_LOCATION, locationById } from "@/data/dashboard"
import type { Endpoint, Rollup, RollupCause } from "@/data/endpoints"
import { rollupsForLocation, rollupsAll } from "@/data/endpoints"
import { pageLabel, pagePath, pageFromPath, type PageId } from "@/nav"

// map a real-time alert type to the issue cause it belongs to
const alertTypeToCause: Record<string, RollupCause> = {
  "Platform outage": "platform",
  "High latency": "latency",
  "Packet loss": "loss",
  "Network jitter": "jitter",
}

export default function App() {
  const [dark, setDark] = useState(false)
  const [page, setPage] = useState<PageId>(() => pageFromPath(window.location.pathname))
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_LOCATION)
  const [endpointFilters, setEndpointFilters] = useState<string[]>([])
  const [alertFilter, setAlertFilter] = useState<string>("all")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [drawer, setDrawer] = useState<{ rows: Endpoint[]; index: number } | null>(null)
  const [alertDrawer, setAlertDrawer] = useState<{ rows: Rollup[]; index: number; expanded?: boolean } | null>(null)
  const [backAlert, setBackAlert] = useState<{ rows: Rollup[]; index: number; expanded?: boolean } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const live = useStreaming()

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  // keep the URL in sync with the current page (shareable per-page links)
  useEffect(() => {
    const path = pagePath[page]
    if (window.location.pathname !== path) window.history.pushState(null, "", path)
  }, [page])

  // back/forward buttons → restore the page from the URL
  useEffect(() => {
    const onPop = () => setPage(pageFromPath(window.location.pathname))
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

  const handleViewEndpoints = (loc?: string | string[]) => {
    if (Array.isArray(loc)) setEndpointFilters(loc)
    else {
      const id = loc ?? selectedId
      setEndpointFilters(id === "all" ? [] : [id])
    }
    setPage("endpoints")
  }

  const handleViewAllAlerts = () => {
    setAlertFilter(selectedId === "all" ? "all" : selectedId)
    setPage("alerts")
  }

  const openEndpointId = drawer ? drawer.rows[drawer.index]?.id ?? null : null
  const openAlertId = alertDrawer ? alertDrawer.rows[alertDrawer.index]?.id ?? null : null

  return (
    <div className="flex h-screen w-full items-start overflow-hidden" style={{ background: "var(--bg-app)" }}>
      {sidebarOpen && (
        <Sidebar active={page} onNavigate={setPage} secondsAgo={live.secondsAgo} />
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
          onViewIssues={() => { setAlertFilter("all"); setPage("alerts") }}
          onAlertNavigate={(a) => {
            if (a.navTo === "endpoints") {
              setEndpointFilters(a.locationId ? [a.locationId] : [])
              setPage("endpoints")
              return
            }
            // navigate to Issues (filtered) AND open the related issue drilldown
            setAlertFilter(a.locationId ?? "all")
            setPage("alerts")
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

      {/* global command palette */}
      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onPickEndpoint={(e) => setDrawer({ rows: [e], index: 0 })}
        onPickLocation={(id) => { setEndpointFilters([id]); setPage("endpoints") }}
      />
    </div>
  )
}
