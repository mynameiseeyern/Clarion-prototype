import { StatsStrip } from "@/components/dashboard/StatsStrip"
import { MapAndLocations } from "@/components/dashboard/MapAndLocations"
import { ActiveAlertsCard } from "@/components/dashboard/ActiveAlertsCard"
import type { LiveFleet } from "@/hooks/useStreaming"

export function OverviewPage({
  live,
  selectedId,
  onSelect,
  onViewEndpoints,
  onViewAllAlerts,
}: {
  live: LiveFleet
  selectedId: string
  onSelect: (id: string) => void
  onViewEndpoints: () => void
  onViewAllAlerts: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <StatsStrip live={live} />
      <MapAndLocations
        selectedId={selectedId}
        onSelect={onSelect}
        onViewEndpoints={onViewEndpoints}
      />
      <ActiveAlertsCard selectedId={selectedId} onViewAll={onViewAllAlerts} />
    </div>
  )
}
