import { StatsStrip } from "@/components/dashboard/StatsStrip"
import { MapAndLocations } from "@/components/dashboard/MapAndLocations"
import { ActiveAlertsCard } from "@/components/dashboard/ActiveAlertsCard"
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
  return (
    <div className="flex flex-col gap-4">
      <StatsStrip live={live} />
      <MapAndLocations
        selectedId={selectedId}
        onSelect={onSelect}
        onViewEndpoints={onViewEndpoints}
      />
      <ActiveAlertsCard selectedId={selectedId} onViewAll={onViewAllAlerts} onOpenAlert={onOpenAlert} />
    </div>
  )
}
