import { StatsStrip } from "@/components/dashboard/StatsStrip"
import { MapAndLocations } from "@/components/dashboard/MapAndLocations"
import { ActiveAlertsCard } from "@/components/dashboard/ActiveAlertsCard"
import type { LiveFleet } from "@/hooks/useStreaming"
import type { Endpoint } from "@/data/endpoints"

export function OverviewPage({
  live,
  selectedId,
  onSelect,
  onViewEndpoints,
  onViewAllAlerts,
  onOpenEndpoint,
}: {
  live: LiveFleet
  selectedId: string
  onSelect: (id: string) => void
  onViewEndpoints: () => void
  onViewAllAlerts: () => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <StatsStrip live={live} />
      <MapAndLocations
        selectedId={selectedId}
        onSelect={onSelect}
        onViewEndpoints={onViewEndpoints}
      />
      <ActiveAlertsCard selectedId={selectedId} onViewAll={onViewAllAlerts} onOpenEndpoint={onOpenEndpoint} />
    </div>
  )
}
