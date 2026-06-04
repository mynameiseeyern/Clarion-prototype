import { useEffect, useState } from "react"
import { TriangleAlert, SlidersHorizontal } from "lucide-react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { Topbar } from "@/components/dashboard/Topbar"
import { OverviewPage } from "@/pages/OverviewPage"
import { EndpointsPage } from "@/pages/EndpointsPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { useStreaming } from "@/hooks/useStreaming"
import { DEFAULT_LOCATION } from "@/data/dashboard"
import { pageLabel, type PageId } from "@/nav"

export default function App() {
  const [dark, setDark] = useState(false)
  const [page, setPage] = useState<PageId>("overview")
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_LOCATION)
  const [endpointFilter, setEndpointFilter] = useState<string>("all")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const live = useStreaming()

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  const handleViewEndpoints = () => {
    setEndpointFilter(selectedId === "all" ? "all" : selectedId)
    setPage("endpoints")
  }

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
        />

        <div className="shrink-0 p-5" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
          <h1 className="text-xl font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
            {pageLabel(page)}
          </h1>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {page === "overview" && (
            <OverviewPage
              live={live}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onViewEndpoints={handleViewEndpoints}
              onViewAllAlerts={() => setPage("alerts")}
            />
          )}
          {page === "endpoints" && (
            <EndpointsPage key={endpointFilter} initialLocationId={endpointFilter} />
          )}
          {page === "alerts" && (
            <PlaceholderPage
              title="Alerts"
              icon={TriangleAlert}
              description="Triage active alerts across all locations, acknowledge or resolve them, and review alert history."
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
    </div>
  )
}
