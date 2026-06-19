import { useState } from "react"
import { StatsStrip } from "@/components/dashboard/StatsStrip"
import { MapAndLocations } from "@/components/dashboard/MapAndLocations"
import { ActiveAlertsCard } from "@/components/dashboard/ActiveAlertsCard"
import { locationById } from "@/data/dashboard"
import type { LiveFleet } from "@/hooks/useStreaming"
import type { Rollup } from "@/data/endpoints"

export function OverviewPage({
  live,
  selectedId,
  onSelect,
  onViewEndpoints,
  onViewAllAlerts,
  onOpenAlert,
}: {
  live: LiveFleet
  selectedId: string
  onSelect: (id: string) => void
  onViewEndpoints: (loc?: string | string[]) => void
  onViewAllAlerts: () => void
  onOpenAlert: (rollups: Rollup[], index: number) => void
}) {
  // The drilled-into country is the map's scope; the alerts card mirrors it so a
  // country drill-in (no specific city) still filters the critical-issues list.
  const [country, setCountry] = useState<string | null>(() => {
    const loc = selectedId === "all" ? undefined : locationById(selectedId)
    return loc?.countryId ?? null
  })

  return (
    <div className="flex flex-col gap-4">
      <StatsStrip live={live} />
      <MapAndLocations
        selectedId={selectedId}
        onSelect={onSelect}
        country={country}
        onCountryChange={setCountry}
        onViewEndpoints={onViewEndpoints}
      />
      <ActiveAlertsCard selectedId={selectedId} country={country} onViewAll={onViewAllAlerts} onOpenAlert={onOpenAlert} />
    </div>
  )
}
