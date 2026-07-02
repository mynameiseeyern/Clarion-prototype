import { useState } from "react"
import { StatsStrip } from "@/components/dashboard/StatsStrip"
import { MapAndLocations } from "@/components/dashboard/MapAndLocations"
import { EndpointsAttentionCard } from "@/components/dashboard/ActiveAlertsCard"
import { locationById } from "@/data/dashboard"
import type { LiveFleet } from "@/hooks/useStreaming"

export function OverviewPage({
  live,
  selectedId,
  onSelect,
  onViewEndpoints,
}: {
  live: LiveFleet
  selectedId: string
  onSelect: (id: string) => void
  onViewEndpoints: (loc?: string | string[]) => void
}) {
  // The drilled-into country is the map's scope (used only by the map now).
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
      {/* height is driven by the drilldown detail; the list scrolls to match */}
      <EndpointsAttentionCard onViewEndpoints={onViewEndpoints} />
    </div>
  )
}
