import { useEffect, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { Topbar } from "@/components/dashboard/Topbar"
import { OverviewPage } from "@/pages/OverviewPage"
import { EndpointsPage } from "@/pages/EndpointsPage"
import { AlertsPage } from "@/pages/AlertsPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { EndpointDrawer } from "@/components/endpoints/drawer/EndpointDrawer"
import { AlertDrawer } from "@/components/alerts/AlertDrawer"
import { CommandPalette } from "@/components/search/CommandPalette"
import { useStreaming } from "@/hooks/useStreaming"
import { DEFAULT_LOCATION, locationById } from "@/data/dashboard"
import type { Endpoint, Rollup } from "@/data/endpoints"
import { pageLabel, type PageId } from "@/nav"

export default function App() {
  const [dark, setDark] = useState(false)
  const [page, setPage] = useState<PageId>("overview")
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_LOCATION)
  const [endpointFilter, setEndpointFilter] = useState<string>("all")
  const [alertFilter, setAlertFilter] = useState<string>("all")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [drawer, setDrawer] = useState<{ rows: Endpoint[]; index: number } | null>(null)
  const [alertDrawer, setAlertDrawer] = useState<Rollup | null>(null)
  const [backRollup, setBackRollup] = useState<Rollup | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const live = useStreaming()

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

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

  const handleViewEndpoints = (locId?: string) => {
    const id = locId ?? selectedId
    setEndpointFilter(id === "all" ? "all" : id)
    setPage("endpoints")
  }

  const handleViewAllAlerts = () => {
    setAlertFilter(selectedId === "all" ? "all" : selectedId)
    setPage("alerts")
  }

  const openEndpointId = drawer ? drawer.rows[drawer.index]?.id ?? null : null

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
        />

        <div className="shrink-0 p-5" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
          <h1 className="text-xl font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
            {page === "endpoints" && endpointFilter !== "all" ? (
              <>
                Endpoints{" "}
                <span style={{ color: "var(--fg-neutral-subtle)" }}>— {locationById(endpointFilter)?.name}</span>
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
              onOpenEndpoint={(rows, index) => setDrawer({ rows, index })}
            />
          )}
          {page === "endpoints" && (
            <EndpointsPage
              locationId={endpointFilter}
              onLocationChange={setEndpointFilter}
              onOpenEndpoint={(rows, index) => setDrawer({ rows, index })}
              openEndpointId={openEndpointId}
            />
          )}
          {page === "alerts" && (
            <AlertsPage
              locationId={alertFilter}
              onLocationChange={setAlertFilter}
              onOpenAlert={setAlertDrawer}
              openAlertId={alertDrawer?.id ?? null}
            />
          )}
          {page === "thresholds" && (
            <PlaceholderPage
              title="Thresholds"
              icon={SlidersHorizontal}
              description="Configure the warning and critical limits that drive alerting for each network quality metric."
            />
          )}
        </div>
      </div>

      {/* global endpoint drilldown */}
      <EndpointDrawer
        rows={drawer?.rows ?? []}
        index={drawer?.index ?? 0}
        open={drawer !== null}
        onIndexChange={(i) => setDrawer((d) => (d ? { ...d, index: i } : d))}
        onOpenChange={(o) => { if (!o) { setDrawer(null); setBackRollup(null) } }}
        backLabel={backRollup ? backRollup.title : undefined}
        onBack={backRollup ? () => { setDrawer(null); setAlertDrawer(backRollup); setBackRollup(null) } : undefined}
      />

      {/* alert rollup drilldown */}
      <AlertDrawer
        rollup={alertDrawer}
        open={alertDrawer !== null}
        onOpenChange={(o) => { if (!o) setAlertDrawer(null) }}
        onOpenEndpoint={(rows, index) => { setAlertDrawer(null); setDrawer({ rows, index }) }}
      />

      {/* global command palette */}
      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onPickEndpoint={(e) => setDrawer({ rows: [e], index: 0 })}
        onPickLocation={(id) => { setEndpointFilter(id); setPage("endpoints") }}
      />
    </div>
  )
}
