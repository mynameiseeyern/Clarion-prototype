import { useEffect, useState } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { Topbar } from "@/components/dashboard/Topbar"
import { StatsStrip } from "@/components/dashboard/StatsStrip"
import { MapAndLocations } from "@/components/dashboard/MapAndLocations"
import { ActiveAlertsCard } from "@/components/dashboard/ActiveAlertsCard"

export default function App() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <div
      className="flex h-screen w-full items-start overflow-hidden"
      style={{ background: "var(--bg-app)" }}
    >
      <Sidebar />

      <div
        className="flex h-full min-w-px flex-1 flex-col overflow-hidden"
        style={{
          borderLeft: "1px solid var(--border-neutral-muted)",
          borderRight: "1px solid var(--border-neutral-muted)",
        }}
      >
        <Topbar dark={dark} onToggleTheme={() => setDark((v) => !v)} />

        {/* page title band */}
        <div
          className="shrink-0 p-5"
          style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}
        >
          <h1 className="text-xl font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
            Overview
          </h1>
        </div>

        {/* scrollable content */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <StatsStrip />
          <MapAndLocations />
          <ActiveAlertsCard />
        </div>
      </div>
    </div>
  )
}
