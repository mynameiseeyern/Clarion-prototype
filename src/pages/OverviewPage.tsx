import { useState } from "react"
import { StatsStrip } from "@/components/dashboard/StatsStrip"
import { MapAndLocations } from "@/components/dashboard/MapAndLocations"
import { EndpointsAttentionCard } from "@/components/dashboard/ActiveAlertsCard"
import { locationById } from "@/data/dashboard"
import type { LiveFleet } from "@/hooks/useStreaming"
import type { Endpoint } from "@/data/endpoints"

export function OverviewPage({
  live,
  selectedId,
  onSelect,
  onViewEndpoints,
  onOpenEndpoint,
}: {
  live: LiveFleet
  selectedId: string
  onSelect: (id: string) => void
  onViewEndpoints: (loc?: string | string[]) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
}) {
  // The drilled-into country is the map's scope (used only by the map now).
  const [country, setCountry] = useState<string | null>(() => {
    const loc = selectedId === "all" ? undefined : locationById(selectedId)
    return loc?.countryId ?? null
  })

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0">
        <StatsStrip live={live} />
      </div>
      <div className="shrink-0">
        <MapAndLocations
          selectedId={selectedId}
          onSelect={onSelect}
          country={country}
          onCountryChange={setCountry}
          onViewEndpoints={onViewEndpoints}
        />
      </div>
      {/* fills the rest of the page height; the table scrolls inside it */}
      <EndpointsAttentionCard onViewEndpoints={onViewEndpoints} onOpenEndpoint={onOpenEndpoint} />
    </div>
  )
}
